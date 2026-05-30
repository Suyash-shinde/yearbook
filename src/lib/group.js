import { SECTIONS } from "../config";

// Groups a flat list of entries into ordered sections (department + division),
// each sorted by roll number. Sections with no entries are dropped entirely,
// and missing roll numbers simply leave no gap — we only render what exists.
export function groupBySection(entries) {
  return SECTIONS.map((section) => {
    const items = entries
      .filter(
        (e) =>
          e.department === section.department && e.division === section.division
      )
      .sort((a, b) => a.roll_number - b.roll_number);
    return { ...section, items };
  }).filter((section) => section.items.length > 0);
}
