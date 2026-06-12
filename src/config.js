// Batch / department configuration.
// Order here controls the order of sections on the home page AND in the PDF.
export const DEPARTMENTS = [
  { id: "Computer", label: "Computer Engineering", divisions: ["A", "B", "C"] },
  { id: "IT", label: "Information Technology", divisions: ["A"] },
  { id: "EnTC", label: "Electronics & Telecommunication", divisions: ["A"] },
  { id: "Civil", label: "Civil Engineering", divisions: ["A"] },
  { id: "Mechanical", label: "Mechanical Engineering", divisions: ["A"] },
];

export const MAX_ROLL = 80;
export const BATCH_LABEL = "Batch of 2026";

// Submissions run inside a window. They reopen at OPEN_AT (after the exam) and
// lock for good at LOCK_AT. Outside that window the yearbook is closed. Keep
// these in sync with public.yearbook_open_at() / public.yearbook_lock_at() in
// supabase/setup.sql — that DB-side check is what actually enforces it.
export const OPEN_AT = new Date("2026-06-11T16:30:00+05:30");
export const LOCK_AT = new Date("2026-06-15T22:00:00+05:30");

// Shown while submissions are temporarily closed before they reopen.
export const REOPEN_NOTICE = [
  "The deadline is Extended, just like every other engineering deadline.",
  "Submissions reopen after the exam tomorrow — 11th June, 4:30 PM IST.",
  "But this is the final deadline this time. It won't reopen again.",
  "Ask you friends to fill the yearbook, Spread the word around - word of mouth will be appreciated!",
  "Thank you mat boliye, bas ye link 3 aur logo ko send karde, and unko bole ki 3 aur logo ko send kare, LMAO",
];

// Closed now, waiting for the reopen time.
export function isBeforeOpen(now = Date.now()) {
  return now < OPEN_AT.getTime();
}

// Past the final deadline — sealed for good.
export function isSealed(now = Date.now()) {
  return now >= LOCK_AT.getTime();
}

// Locked covers both the pre-reopen gap and the permanent seal.
export function isLocked(now = Date.now()) {
  return isBeforeOpen(now) || isSealed(now);
}

// Flat list of every valid department+division pair, in display order.
export const SECTIONS = DEPARTMENTS.flatMap((d) =>
  d.divisions.map((div) => ({
    department: d.id,
    departmentLabel: d.label,
    division: div,
    key: `${d.id}-${div}`,
    title: `${d.label} — Division ${div}`,
  }))
);

export function departmentLabel(id) {
  return DEPARTMENTS.find((d) => d.id === id)?.label ?? id;
}
