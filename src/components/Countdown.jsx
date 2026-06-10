import { useEffect, useState } from "react";
import { OPEN_AT, LOCK_AT, REOPEN_NOTICE } from "../config";

// Live ticking countdown around the submission window. Before OPEN_AT it shows
// the "reopening soon" notice and counts down to reopening; while open it
// counts down to the final deadline; after LOCK_AT it flips to a "sealed"
// banner. The `onLock` callback fires whenever the open/closed state changes so
// parents can re-render their gated controls.
function phaseOf(now) {
  if (now < OPEN_AT.getTime()) return "before";
  if (now < LOCK_AT.getTime()) return "open";
  return "sealed";
}

function targetFor(phase) {
  return phase === "before" ? OPEN_AT.getTime() : LOCK_AT.getTime();
}

function parts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function label(date) {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const DEADLINE_LABEL = label(LOCK_AT);

export default function Countdown({ onLock }) {
  const [now, setNow] = useState(Date.now);

  const phase = phaseOf(now);

  useEffect(() => {
    let last = phaseOf(Date.now());
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      const next = phaseOf(current);
      if (next !== last) {
        last = next;
        onLock?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [onLock]);

  if (phase === "sealed") {
    return (
      <div className="countdown sealed">
        <span className="countdown-lead">The yearbook is sealed</span>
        <span className="countdown-note">
          Entries closed on {DEADLINE_LABEL} IST. These pages are now permanent.
        </span>
      </div>
    );
  }

  const t = parts(targetFor(phase) - now);
  const units = [
    { value: t.days, label: "days" },
    { value: t.hours, label: "hrs" },
    { value: t.minutes, label: "min" },
    { value: t.seconds, label: "sec" },
  ];

  if (phase === "before") {
    return (
      <div className="countdown closed">
        <span className="countdown-lead">Submissions reopen in</span>
        <div className="countdown-clock">
          {units.map((u) => (
            <span className="countdown-unit" key={u.label}>
              <strong>{String(u.value).padStart(2, "0")}</strong>
              <em>{u.label}</em>
            </span>
          ))}
        </div>
        <div className="countdown-notice">
          {REOPEN_NOTICE.map((line) => (
            <span className="countdown-note" key={line}>
              {line}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="countdown">
      <span className="countdown-lead">Entries close in</span>
      <div className="countdown-clock">
        {units.map((u) => (
          <span className="countdown-unit" key={u.label}>
            <strong>{String(u.value).padStart(2, "0")}</strong>
            <em>{u.label}</em>
          </span>
        ))}
      </div>
      <span className="countdown-note">
        Add or edit your entry before {DEADLINE_LABEL} IST — after that the
        yearbook is sealed for good.
      </span>
    </div>
  );
}
