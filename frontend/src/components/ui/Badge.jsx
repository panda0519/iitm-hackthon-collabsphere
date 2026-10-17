import { Icon } from "./Icon.jsx";

export const TONES = {
  neutral: "bg-s2 text-mu border-line",
  pri: "bg-pri/15 text-pritx border-pri/30",
  ok: "bg-ok/15 text-ok border-ok/30",
  bad: "bg-bad/15 text-bad border-bad/30",
  info: "bg-info/15 text-info border-info/30"
};

export function Badge({ tone = "neutral", icon, children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {icon && <Icon name={icon} className="w-3 h-3" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  if (status === "APPROVED_LIVE") return <Badge tone="ok">Live</Badge>;
  if (status === "PENDING_COHOST") return <Badge tone="pri">Waiting for co-host</Badge>;
  if (status === "CANCELLED") return <Badge tone="neutral">Cancelled</Badge>;
  return <Badge tone="bad">Rejected</Badge>;
}
