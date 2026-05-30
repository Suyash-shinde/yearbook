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
