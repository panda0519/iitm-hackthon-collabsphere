import { Avatar } from "../ui/Avatar.jsx";
import { HouseChip } from "../ui/HouseChip.jsx";
import { Btn } from "../ui/Btn.jsx";

export function PeerCard({ p, selected, pinged, onClick, onPing }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`rounded-2xl border p-3 cursor-pointer transition ${selected ? "border-pri/60 bg-pri/10" : "border-line bg-s2/50 hover:bg-s2"}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={p.name} house={p.house} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-tx truncate">
              {p.name}
              {p.id === "me" ? " (you)" : ""}
            </span>
            <span className="text-[11px] text-mu">{p.level}</span>
          </div>
          <div className="text-xs text-ok mt-0.5">{p.status}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <HouseChip house={p.house} />
            {p.skills.map((s) => (
              <span key={s} className="text-[11px] px-1.5 py-0.5 rounded-md bg-line/50 text-mu">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] text-mu">{p.dist.toFixed(1)} km</div>
          {p.id !== "me" && (
            <Btn
              size="sm"
              variant={pinged ? "soft" : "primary"}
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onPing(p.id);
              }}
            >
              {pinged ? "Pinged" : "Ping"}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
