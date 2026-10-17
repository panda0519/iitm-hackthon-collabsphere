import { StatusBadge } from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { houseColor, prettyDate } from "@collabsphere/shared";

export function ApprovalRow({ ev, actions }) {
  const entries = Object.entries(ev.approvals);
  const done = entries.filter(([, ok]) => ok).length;
  return (
    <div className="rounded-2xl border border-line bg-s2/50 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-mu">
            {ev.city}, {prettyDate(ev.date)}
          </div>
          <div className="font-display font-semibold text-[15px] text-tx leading-snug">{ev.title}</div>
          <div className="text-xs text-mu mt-0.5 truncate">
            {ev.venue}, +{ev.xpReward} XP
          </div>
        </div>
        <StatusBadge status={ev.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {entries.map(([house, ok]) => {
          const rejected = ev.status === "REJECTED" && !ok;
          return (
            <span
              key={house}
              className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full text-xs font-medium text-tx border ${
                ok ? "border-ok/40 bg-ok/10" : rejected ? "border-bad/40 bg-bad/10" : "border-line bg-s1"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: houseColor(house) }} />
              {house}
              <Icon
                name={ok ? "check" : rejected ? "x" : "clock"}
                className={`w-3.5 h-3.5 ${ok ? "text-ok" : rejected ? "text-bad" : "text-mu"}`}
              />
            </span>
          );
        })}
        <span className="text-[11px] text-mu ml-auto">
          {done} of {entries.length} approved
        </span>
      </div>
      <div className="h-1 rounded-full bg-line/60 mt-2.5 overflow-hidden">
        <div className="h-full rounded-full bg-ok transition-all duration-500" style={{ width: `${(done / entries.length) * 100}%` }} />
      </div>
      {actions}
    </div>
  );
}
