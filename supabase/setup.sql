-- ============================================================================
--  Yearbook — Supabase setup
--  Paste this whole file into:  Supabase Dashboard -> SQL Editor -> New query
--  then click RUN.  Safe to run more than once.
-- ============================================================================

-- pgcrypto gives us crypt()/gen_salt() for hashing PINs.
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Table.  pin_hash lives here but is NEVER exposed to the browser (see below).
-- ----------------------------------------------------------------------------
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  department  text        not null,
  division    text        not null,
  roll_number int         not null,
  quote       text        not null default '',
  image_url   text        not null,
  pin_hash    text        not null,
  created_at  timestamptz not null default now(),
  unique (department, division, roll_number)
);

-- Lock the table down completely. No browser client can read or write it
-- directly; everything goes through the view + functions below.
alter table public.entries enable row level security;
revoke all on public.entries from anon, authenticated;

-- ----------------------------------------------------------------------------
-- Public view: everything EXCEPT pin_hash. This is what the website reads.
-- ----------------------------------------------------------------------------
create or replace view public.public_entries as
  select id, name, department, division, roll_number, quote, image_url, created_at
  from public.entries;

grant select on public.public_entries to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Submission window. Submissions reopen at yearbook_open_at() and seal for good
-- at yearbook_lock_at(): outside that window no inserts, updates or deletes are
-- accepted. Keep in sync with OPEN_AT / LOCK_AT in src/config.js.
-- ----------------------------------------------------------------------------
create or replace function public.yearbook_open_at() returns timestamptz
language sql immutable as $$ select timestamptz '2026-06-11 16:30:00+05:30' $$;

create or replace function public.yearbook_lock_at() returns timestamptz
language sql immutable as $$ select timestamptz '2026-06-15 22:00:00+05:30' $$;

-- Raise if we're outside the submission window. Called by every mutating
-- function below.
create or replace function public.assert_open() returns void
language plpgsql as $$
begin
  if now() < public.yearbook_open_at() then
    raise exception 'Submissions are closed; they reopen on 11 June, 4:30 PM IST.'
      using errcode = 'P0001';
  end if;
  if now() >= public.yearbook_lock_at() then
    raise exception 'The yearbook is sealed; entries can no longer be changed.'
      using errcode = 'P0001';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- submit_entry: create a new entry, hashing the PIN. Runs as the table owner
-- (security definer) so it can write even though the table is locked.
-- ----------------------------------------------------------------------------
create or replace function public.submit_entry(
  p_name text, p_department text, p_division text, p_roll int,
  p_quote text, p_image_url text, p_pin text
) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.assert_open();
  insert into public.entries
    (name, department, division, roll_number, quote, image_url, pin_hash)
  values
    (p_name, p_department, p_division, p_roll, p_quote, p_image_url,
     crypt(p_pin, gen_salt('bf')));
end;
$$;

-- ----------------------------------------------------------------------------
-- verify_entry: check roll + PIN; return the entry (no pin) if they match.
-- ----------------------------------------------------------------------------
create or replace function public.verify_entry(
  p_department text, p_division text, p_roll int, p_pin text
) returns table (
  id uuid, name text, department text, division text,
  roll_number int, quote text, image_url text
)
language plpgsql security definer set search_path = public, extensions as $$
begin
  return query
    select e.id, e.name, e.department, e.division,
           e.roll_number, e.quote, e.image_url
    from public.entries e
    where e.department = p_department
      and e.division = p_division
      and e.roll_number = p_roll
      and e.pin_hash = crypt(p_pin, e.pin_hash);
end;
$$;

-- ----------------------------------------------------------------------------
-- update_entry: change quote/photo only if the PIN matches. Returns true/false.
-- ----------------------------------------------------------------------------
create or replace function public.update_entry(
  p_department text, p_division text, p_roll int, p_pin text,
  p_quote text, p_image_url text
) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare affected int;
begin
  perform public.assert_open();
  update public.entries e
    set quote = p_quote, image_url = p_image_url
  where e.department = p_department
    and e.division = p_division
    and e.roll_number = p_roll
    and e.pin_hash = crypt(p_pin, e.pin_hash);
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

-- ----------------------------------------------------------------------------
-- delete_entry: remove an entry entirely, only if the PIN matches.
-- ----------------------------------------------------------------------------
create or replace function public.delete_entry(
  p_department text, p_division text, p_roll int, p_pin text
) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare affected int;
begin
  perform public.assert_open();
  delete from public.entries e
  where e.department = p_department
    and e.division = p_division
    and e.roll_number = p_roll
    and e.pin_hash = crypt(p_pin, e.pin_hash);
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

-- Let the browser (anon) call these functions.
grant execute on function public.submit_entry(text,text,text,int,text,text,text) to anon, authenticated;
grant execute on function public.verify_entry(text,text,int,text) to anon, authenticated;
grant execute on function public.update_entry(text,text,int,text,text,text) to anon, authenticated;
grant execute on function public.delete_entry(text,text,int,text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Storage: a public bucket "photos" the browser can upload to and read from.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "public read photos" on storage.objects;
create policy "public read photos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'photos');

drop policy if exists "anon upload photos" on storage.objects;
create policy "anon upload photos"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'photos');
