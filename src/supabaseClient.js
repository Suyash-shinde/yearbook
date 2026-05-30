import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Helpful message during development if .env.local is missing.
  console.error(
    "Missing Supabase env vars. Copy .env.example to .env.local and fill in your project URL + anon key."
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");

export const PHOTO_BUCKET = "photos";
