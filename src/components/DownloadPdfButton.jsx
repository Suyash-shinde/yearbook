import { useState } from "react";
import { groupBySection } from "../lib/group";

// Generates the PDF on demand and triggers a browser download. Each division
// starts on a fresh page. The heavy @react-pdf library is imported lazily here
// so it doesn't bloat the initial page load.
export default function DownloadPdfButton({ entries }) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    const sections = groupBySection(entries);
    if (sections.length === 0) return;

    setBusy(true);
    try {
      const [{ pdf }, { default: YearbookPdf }, { getPaperTextureDataUrl }] =
        await Promise.all([
          import("@react-pdf/renderer"),
          import("../pdf/YearbookPdf"),
          import("../pdf/paperTexture"),
        ]);
      const texture = await getPaperTextureDataUrl();
      const blob = await pdf(
        <YearbookPdf sections={sections} texture={texture} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "yearbook-2026.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Could not generate PDF: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn" onClick={handleDownload} disabled={busy || !entries.length}>
      {busy ? "Building PDF…" : "Download PDF"}
    </button>
  );
}
