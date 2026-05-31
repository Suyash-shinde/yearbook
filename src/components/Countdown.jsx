import { useEffect, useState } from "react";
import { LOCK_AT } from "../config";

// Live ticking countdown to the submission deadline. Once the deadline passes
// it flips to a "sealed" banner. The `onLock` callback fires once when the
// clock crosses zero so parents can re-render their gated controls.
function remaining() {
  return LOCK_AT.getTime() - Date.now();
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

const DEADLINE_LABEL = LOCK_AT.toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export default function Countdown({ onLock }) {
  const [ms, setMs] = useState(remaining);

  useEffect(() => {
    const id = setInterval(() => {
      const left = remaining();
      setMs(left);
      if (left <= 0) {
        clearInterval(id);
        onLock?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [onLock]);

  if (ms <= 0) {
    return (
      <div className="countdown sealed">
        <span className="countdown-lead">The yearbook is sealed</span>
        <span className="countdown-note">
          Entries closed on {DEADLINE_LABEL} IST. These pages are now permanent.
        </span>
      </div>
    );
  }

  const t = parts(ms);
  const units = [
    { value: t.days, label: "days" },
    { value: t.hours, label: "hrs" },
    { value: t.minutes, label: "min" },
    { value: t.seconds, label: "sec" },
  ];

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
