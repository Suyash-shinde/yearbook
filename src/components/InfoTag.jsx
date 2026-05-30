// A small "ⓘ" badge that reveals a tooltip on hover and on focus/tap (so it
// works on touch screens too). Pass `center` for centered contexts like the
// cover, and `light` when sitting on a dark background.
export default function InfoTag({ children, center = false, light = false }) {
  const cls = ["info", center && "center", light && "light"]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} tabIndex={0} role="note">
      <span className="info-icon" aria-hidden="true">i</span>
      <span className="info-bubble">{children}</span>
    </span>
  );
}
