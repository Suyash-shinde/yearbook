import { supabase } from "../supabaseClient";
import staticEntries from "../data/entries.json";

// The yearbook is frozen and read-only: entries (and their photos) are baked
// into the build by scripts/export-static.mjs, so reads are served by the
// static host instead of Supabase — no database queries, no Storage egress.
export async function fetchEntries() {
  return staticEntries;
}

// Create a new entry. The PIN is hashed inside the database function;
// it never travels back out. A taken roll number is rejected by the DB.
export async function submitEntry({
  name,
  department,
  division,
  roll,
  quote,
  imageUrl,
  pin,
}) {
  const { error } = await supabase.rpc("submit_entry", {
    p_name: name,
    p_department: department,
    p_division: division,
    p_roll: roll,
    p_quote: quote,
    p_image_url: imageUrl,
    p_pin: pin,
  });

  if (error) {
    if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
      throw new Error(
        "That roll number is already taken in this division. Use “Edit my entry” instead."
      );
    }
    throw new Error(error.message);
  }
}

// Verify roll + PIN and load the existing entry so the user can edit it.
// Returns the entry on success, or null if the PIN is wrong / not found.
export async function verifyAndLoad({ department, division, roll, pin }) {
  const { data, error } = await supabase.rpc("verify_entry", {
    p_department: department,
    p_division: division,
    p_roll: roll,
    p_pin: pin,
  });

  if (error) throw new Error(error.message);
  return data && data.length ? data[0] : null;
}

// Update quote and/or photo of an existing entry, guarded by the PIN.
export async function updateEntry({
  department,
  division,
  roll,
  pin,
  quote,
  imageUrl,
}) {
  const { data, error } = await supabase.rpc("update_entry", {
    p_department: department,
    p_division: division,
    p_roll: roll,
    p_pin: pin,
    p_quote: quote,
    p_image_url: imageUrl,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Wrong PIN or entry not found.");
}

// Permanently delete an entry, guarded by the PIN.
export async function deleteEntry({ department, division, roll, pin }) {
  const { data, error } = await supabase.rpc("delete_entry", {
    p_department: department,
    p_division: division,
    p_roll: roll,
    p_pin: pin,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Wrong PIN or entry not found.");
}
