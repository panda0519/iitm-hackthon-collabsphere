import { useNow } from "../../hooks/useNow.js";
import { p2 } from "@collabsphere/shared";

export function Countdown({ target }) {
  const now = useNow(1000);
  const ms = target - now;
  if (ms <= 0)
    return (
      <div className="text-sm font-semibold text-ok" role="status">
        Happening now. Open check-in to claim your XP.
      </div>
    );
  const s = Math.floor(ms / 1000);
  const parts = [
    ["days", Math.floor(s / 86400)],
    ["hrs", Math.floor((s % 86400) / 3600)],
    ["min", Math.floor((s % 3600) / 60)],
    ["sec", s % 60]
  ];
  return (
    <div className="grid grid-cols-4 gap-2" role="timer" aria-label="Time until the event starts">
      {parts.map(([label, v]) => (
        <div key={label} className="digit rounded-xl py-2 text-center">
          <div className="font-display font-extrabold text-2xl text-tx tabular-nums">{p2(v)}</div>
          <div className="text-[10px] text-mu">{label}</div>
        </div>
      ))}
    </div>
  );
}
