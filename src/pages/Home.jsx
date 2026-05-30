import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEntries } from "../lib/entries";
import { groupBySection } from "../lib/group";
import { BATCH_LABEL } from "../config";
import EntryCard from "../components/EntryCard";
import DownloadPdfButton from "../components/DownloadPdfButton";
import InfoTag from "../components/InfoTag";

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEntries()
      .then((data) => {
        setEntries(data);
        setStatus("ready");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, []);

  const sections = groupBySection(entries);

  return (
    <div className="page">
      <header className="cover">
        <p className="cover-kicker">The Yearbook</p>
        <h1 className="cover-title">{BATCH_LABEL}</h1>
        <div className="cover-rule" />
        <p className="cover-sub">
          A book of faces, names &amp; words to remember
          <InfoTag center light>
            A yearbook is a keepsake that gathers everyone in the batch — each
            person's photo, name and a personal quote — so years from now you
            can look back and remember these days together. Add your own entry,
            then flip through your classmates'.
          </InfoTag>
        </p>
        <div className="hero-actions">
          <Link className="btn gold" to="/submit">
            Add my entry
          </Link>
          <Link className="btn" to="/edit">
            Edit my entry
          </Link>
          <DownloadPdfButton entries={entries} />
        </div>
      </header>

      {status === "loading" && <p className="muted">Loading entries…</p>}
      {status === "error" && <p className="error">Could not load: {error}</p>}
      {status === "ready" && sections.length === 0 && (
        <p className="muted">No entries yet — be the first to add yours!</p>
      )}

      {sections.map((section) => (
        <section key={section.key} className="division-section">
          <h2 className="division-title">{section.title}</h2>
          <div className="grid">
            {section.items.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
