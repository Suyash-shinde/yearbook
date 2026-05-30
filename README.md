# Yearbook — Batch of 2026

A no-backend yearbook site. Students upload a photo + quote, pick their
department/division/roll number, and protect their entry with a 4-digit PIN.
The home page shows everyone grouped by division; a "Download PDF" button
exports a print-ready book with each division starting on a new page.

Stack: **React + Vite** (frontend) · **Supabase** (hosted database + file
storage — the only "backend", fully managed) · **@react-pdf/renderer** (PDF).

## 1. Create your Supabase project (one time, ~5 min)

1. Go to <https://supabase.com> → sign in → **New project**.
2. Pick a name, set a database password (save it somewhere), choose the region
   closest to your college, and create the project. Wait ~2 min for it to spin up.
3. In the left sidebar open **SQL Editor → New query**. Open the file
   [`supabase/setup.sql`](supabase/setup.sql) from this repo, paste its entire
   contents in, and click **Run**. This creates the table, the public view, the
   secure functions, and the `photos` storage bucket. (Safe to re-run.)
4. Open **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key (safe to ship in a website)

## 2. Configure the app

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste in the two values from step 1.4:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 3. Run it locally

```bash
npm install      # already done if node_modules is present
npm run dev
```

Open the printed URL (usually <http://localhost:5173>).

## 4. Deploy (free)

Push this repo to GitHub, then import it into **Vercel** or **Netlify**.
- Build command: `npm run build`
- Output directory: `dist`
- Add the same two env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  in the host's project settings.

## How the PIN security works

- PINs are **hashed** (bcrypt via pgcrypto) inside the database; the raw PIN
  and even the hash are never sent to the browser.
- The website only reads from `public_entries`, a view that excludes the hash.
- All writes go through `submit_entry` / `verify_entry` / `update_entry`
  database functions, which check the PIN server-side. The base table is locked
  with Row Level Security so the browser can't touch it directly.

## Admin / moderation

Manage everything from the Supabase dashboard without a PIN:
- **Table Editor → entries**: fix names, quotes, roll numbers, or delete an
  entry (e.g. something inappropriate).
- **Storage → photos**: view or remove uploaded images.

## Changing departments / divisions / roll limit

Edit [`src/config.js`](src/config.js) — the `DEPARTMENTS` list drives the
dropdowns, the home-page section order, and the PDF page order.
