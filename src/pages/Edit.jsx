import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SectionPicker from "../components/SectionPicker";
import { DEPARTMENTS, MAX_ROLL, isLocked, isBeforeOpen, REOPEN_NOTICE } from "../config";
import { validateImage, uploadPhoto } from "../lib/photos";
import { verifyAndLoad, updateEntry, deleteEntry } from "../lib/entries";

export default function Edit() {
  const navigate = useNavigate();
  const [creds, setCreds] = useState({
    department: DEPARTMENTS[0].id,
    division: DEPARTMENTS[0].divisions[0],
    roll: "",
    pin: "",
  });
  const [entry, setEntry] = useState(null); // loaded after PIN check
  const [quote, setQuote] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onVerify(e) {
    e.preventDefault();
    setError("");
    const roll = Number(creds.roll);
    if (!Number.isInteger(roll) || roll < 1 || roll > MAX_ROLL)
      return setError(`Roll number must be between 1 and ${MAX_ROLL}.`);
    if (!/^\d{4}$/.test(creds.pin)) return setError("Enter your 4-digit PIN.");

    setBusy(true);
    try {
      const found = await verifyAndLoad({
        department: creds.department,
        division: creds.division,
        roll,
        pin: creds.pin,
      });
      if (!found) {
        setError("No entry found for that roll number, or the PIN is wrong.");
      } else {
        setEntry(found);
        setQuote(found.quote ?? "");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function onFile(e) {
    const f = e.target.files[0];
    const err = validateImage(f);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function onDelete() {
    if (isLocked()) {
      setError("Editing has closed — the yearbook is now sealed.");
      return;
    }
    if (
      !window.confirm(
        "Delete your entry permanently? This removes your photo and quote from the yearbook and can't be undone."
      )
    )
      return;
    setError("");
    setBusy(true);
    try {
      await deleteEntry({
        department: entry.department,
        division: entry.division,
        roll: entry.roll_number,
        pin: creds.pin,
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function onSave(e) {
    e.preventDefault();
    setError("");
    if (isLocked())
      return setError("Editing has closed — the yearbook is now sealed.");
    setBusy(true);
    try {
      let imageUrl = entry.image_url;
      if (file) {
        imageUrl = await uploadPhoto(file, {
          department: entry.department,
          division: entry.division,
          roll: entry.roll_number,
        });
      }
      await updateEntry({
        department: entry.department,
        division: entry.division,
        roll: entry.roll_number,
        pin: creds.pin,
        quote: quote.trim(),
        imageUrl,
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (isLocked()) {
    return (
      <div className="page narrow">
        <Link className="back" to="/">← Back to yearbook</Link>
        <h1 className="page-title">Edit my entry</h1>
        <div className="paper">
          {isBeforeOpen() ? (
            REOPEN_NOTICE.map((line) => (
              <p className="muted" key={line}>
                {line}
              </p>
            ))
          ) : (
            <p className="muted">
              The yearbook is sealed — editing closed on 12 June, 10:00 PM IST.
              Entries are now permanent.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <Link className="back" to="/">← Back to yearbook</Link>
      <h1 className="page-title">Edit my entry</h1>

      {!entry ? (
        <div className="paper">
        <form className="form" onSubmit={onVerify}>
          <SectionPicker
            department={creds.department}
            division={creds.division}
            onChange={(s) => setCreds((c) => ({ ...c, ...s }))}
          />
          <label className="field">
            <span>Roll number</span>
            <input
              type="number"
              min="1"
              max={MAX_ROLL}
              value={creds.roll}
              onChange={(e) => setCreds((c) => ({ ...c, roll: e.target.value }))}
            />
          </label>
          <label className="field">
            <span>Your 4-digit PIN</span>
            <input
              type="password"
              inputMode="numeric"
              value={creds.pin}
              onChange={(e) =>
                setCreds((c) => ({ ...c, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))
              }
              placeholder="••••"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? "Checking…" : "Unlock my entry"}
          </button>
        </form>
        </div>
      ) : (
        <div className="paper">
        <form className="form" onSubmit={onSave}>
          <p className="muted">
            Editing <strong>{entry.name}</strong> — Roll No. {entry.roll_number}
          </p>
          <img
            className="preview"
            src={preview ?? entry.image_url}
            alt="current"
          />
          <label className="field">
            <span>Replace photo (optional)</span>
            <input type="file" accept="image/png,image/jpeg" onChange={onFile} />
          </label>
          <label className="field">
            <span>Quote</span>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button
              className="btn danger"
              type="button"
              onClick={onDelete}
              disabled={busy}
            >
              Delete entry
            </button>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
        </div>
      )}
    </div>
  );
}
