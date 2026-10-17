import { Fragment } from "react";
import { Badge } from "../ui/Badge.jsx";
import { HouseChip } from "../ui/HouseChip.jsx";
import { Icon } from "../ui/Icon.jsx";
import { hostHouses, houseSplit, relLabel } from "@collabsphere/shared";

export function EventCard({ ev, selected, rsvped, onClick }) {
  const hs = hostHouses(ev);
  const when = relLabel(ev.date);
  const hot = /^(Today|Tomorrow|In \d+ min|Happening)/.test(when);
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? onKey : undefined}
      aria-pressed={onClick ? !!selected : undefined}
      className={`relative rounded-2xl border p-3 pl-4 text-left transition ${onClick ? "cursor-pointer" : ""} ${
        selected ? "border-pri/60 bg-pri/10" : "border-line bg-s2/50 hover:bg-s2"
      }`}
    >
      <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full" style={{ background: houseSplit(hs) }} />
      <div className="flex items-center gap-2 text-[11px] text-mu">
        {when && <Badge tone={hot ? "pri" : "neutral"}>{when}</Badge>}
        {rsvped && (
          <Badge tone="ok" icon="check">
            Going
          </Badge>
        )}
        <span className="ml-auto">{ev.dist !== undefined ? `${ev.dist.toFixed(1)} km` : ev.category}</span>
      </div>
      <div className="font-display font-semibold text-[15px] leading-snug text-tx mt-1.5">{ev.title}</div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
        {hs.map((h, i) => (
          <Fragment key={h}>
            {i > 0 && <span className="text-[11px] text-mu">with</span>}
            <HouseChip house={h} />
          </Fragment>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-xs text-mu min-w-0">
        <Icon name="pin" className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{ev.venue}</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge tone="ok">+{ev.xpReward} XP</Badge>
        <span className="text-xs text-mu">{ev.rsvps.length} going</span>
        {ev.dist !== undefined && <span className="text-xs text-mu ml-auto">{ev.category}</span>}
      </div>
    </div>
  );
}
