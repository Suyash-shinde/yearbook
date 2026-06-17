// One-time export: pulls the frozen yearbook out of Supabase and bakes it into
// the static site so Vercel serves everything and Supabase egress drops to zero.
//
//   node scripts/export-static.mjs
//
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env.local (or the
// environment). Writes:
//   • public/photos/*.jpg   — every entry photo, downloaded once
//   • src/data/entries.json — all entries, with image_url rewritten to /photos/…
//
// Safe to re-run: existing photos are skipped, the JSON is regenerated.

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";

// --- load env from .env.local / .env without adding a dependency ------------
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_.]+)\s*=\s*(.*)\s*$/i);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Add them to .env.local."
  );
  process.exit(1);
}

const PHOTO_DIR = "public/photos";
const DATA_FILE = "src/data/entries.json";

// --- fetch every entry from the public view ---------------------------------
const listUrl =
  `${SUPABASE_URL}/rest/v1/public_entries` +
  `?select=*&order=roll_number.asc`;

const res = await fetch(listUrl, {
  headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
});
if (!res.ok) {
  console.error("Failed to fetch entries:", res.status, await res.text());
  process.exit(1);
}
const entries = await res.json();
console.log(`Fetched ${entries.length} entries.`);

mkdirSync(PHOTO_DIR, { recursive: true });
mkdirSync("src/data", { recursive: true });

// Turn a storage public URL into a flat, collision-free local filename.
// e.g. …/public/photos/Computer-A/12-1699999999.jpg -> Computer-A__12-1699999999.jpg
function localName(imageUrl) {
  const marker = "/photos/";
  const i = imageUrl.indexOf(marker);
  const rel = i >= 0 ? imageUrl.slice(i + marker.length) : imageUrl.split("/").pop();
  return decodeURIComponent(rel).replace(/[/\\]/g, "__");
}

let downloaded = 0;
let skipped = 0;
for (const entry of entries) {
  if (!entry.image_url) continue;
  const name = localName(entry.image_url);
  const dest = join(PHOTO_DIR, name);

  if (existsSync(dest)) {
    skipped++;
  } else {
    const img = await fetch(entry.image_url);
    if (!img.ok) {
      console.warn(`  ⚠ ${entry.name} (roll ${entry.roll_number}): image ${img.status}`);
      continue;
    }
    writeFileSync(dest, Buffer.from(await img.arrayBuffer()));
    downloaded++;
    process.stdout.write(`\r  downloaded ${downloaded}…`);
  }

  // Point the entry at the bundled copy.
  entry.image_url = `/photos/${name}`;
}

writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2) + "\n");

console.log(
  `\nDone. ${downloaded} photos downloaded, ${skipped} already present.\n` +
    `Wrote ${DATA_FILE}.\n\n` +
    `Next: commit public/photos + src/data/entries.json, then redeploy.`
);
