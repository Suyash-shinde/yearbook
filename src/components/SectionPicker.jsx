import { DEPARTMENTS } from "../config";

// Department dropdown + a division dropdown that depends on it.
export default function SectionPicker({ department, division, onChange }) {
  const dept = DEPARTMENTS.find((d) => d.id === department);

  return (
    <div className="row">
      <label className="field">
        <span>Department</span>
        <select
          value={department}
          onChange={(e) => {
            const next = DEPARTMENTS.find((d) => d.id === e.target.value);
            // Reset division to the first valid one for the new department.
            onChange({ department: e.target.value, division: next.divisions[0] });
          }}
        >
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Division</span>
        <select
          value={division}
          onChange={(e) => onChange({ department, division: e.target.value })}
        >
          {dept.divisions.map((div) => (
            <option key={div} value={div}>
              Division {div}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
