import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SectionPicker from "../components/SectionPicker";
import { DEPARTMENTS, MAX_ROLL } from "../config";
import { validateImage, uploadPhoto } from "../lib/photos";
import { submitEntry } from "../lib/entries";

export default function Submit() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    department: DEPARTMENTS[0].id,
    division: DEPARTMENTS[0].divisions[0],
    roll: "",
    quote: "",
    pin: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onFile(e) {
    const f = e.target.files[0];
    const err = validateImage(f);
    if (err) {
      setError(err);
      setFile(null);
      setPreview(null);
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const roll = Number(form.roll);
    if (!form.name.trim()) return setError("Please enter your name.");
    if (!Number.isInteger(roll) || roll < 1 || roll > MAX_ROLL)
      return setError(`Roll number must be between 1 and ${MAX_ROLL}.`);
    if (!/^\d{4}$/.test(form.pin))
      return setError("PIN must be exactly 4 digits. Remember it — you'll need it to edit.");
    const imgErr = validateImage(file);
    if (imgErr) return setError(imgErr);

    setBusy(true);
    try {
      const imageUrl = await uploadPhoto(file, {
        department: form.department,
        division: form.division,
        roll,
      });
      await submitEntry({
        name: form.name.trim(),
        department: form.department,
        division: form.division,
        roll,
        quote: form.quote.trim(),
        imageUrl,
        pin: form.pin,
      });
      navigate("/", { state: { justAdded: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <Link className="back" to="/">← Back to yearbook</Link>
      <h1 className="page-title">Add my entry</h1>

      <div className="paper">
      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span>Full name</span>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Aisha Khan"
            maxLength={60}
          />
        </label>

        <SectionPicker
          department={form.department}
          division={form.division}
          onChange={(s) => setForm((f) => ({ ...f, ...s }))}
        />

        <label className="field">
          <span>Roll number (1–{MAX_ROLL})</span>
          <input
            type="number"
            min="1"
            max={MAX_ROLL}
            value={form.roll}
            onChange={(e) => set("roll", e.target.value)}
          />
        </label>

        <label className="field">
          <span>Quote</span>
          <textarea
            value={form.quote}
            onChange={(e) => set("quote", e.target.value)}
            placeholder="A line you'd like remembered by…"
            rows={3}
            maxLength={200}
          />
        </label>

        <label className="field">
          <span>Photo (PNG / JPG / JPEG)</span>
          <input type="file" accept="image/png,image/jpeg" onChange={onFile} />
        </label>
        {preview && <img className="preview" src={preview} alt="preview" />}

        <label className="field">
          <span>Set a 4-digit PIN (to edit later)</span>
          <input
            type="password"
            inputMode="numeric"
            value={form.pin}
            onChange={(e) => set("pin", e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "Submitting…" : "Submit entry"}
        </button>
        <p className="hint">
          Keep your PIN safe — you'll need it to edit or delete your entry later.
        </p>
      </form>
      </div>
    </div>
  );
}
