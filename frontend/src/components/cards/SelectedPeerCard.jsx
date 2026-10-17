import { Avatar } from "../ui/Avatar.jsx";
import { HouseChip } from "../ui/HouseChip.jsx";
import { Btn } from "../ui/Btn.jsx";
import { Icon } from "../ui/Icon.jsx";

export function SelectedPeerCard({ p, pinged, onClose, onPing }) {
  return (
    <div className="pointer-events-auto pop-in w-full max-w-md glass rounded-2xl p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <Avatar name={p.name} house={p.house} size={40} />
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-base text-tx">
            {p.name}
            {p.id === "me" ? " (you)" : ""}
          </div>
          <div className="text-xs text-ok">{p.status}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <HouseChip house={p.house} />
            <span className="text-[11px] text-mu">{p.level}</span>
            {p.skills.map((s) => (
              <span key={s} className="text-[11px] px-1.5 py-0.5 rounded-md bg-line/50 text-mu">
                {s}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg text-mu hover:text-tx hover:bg-s2 flex items-center justify-center shrink-0"
          aria-label="Close person details"
        >
          <Icon name="x" />
        </button>
      </div>
      {p.id !== "me" && (
        <Btn
          size="sm"
          variant={pinged ? "soft" : "primary"}
          icon={pinged ? "check" : "bolt"}
          className="mt-3"
          onClick={() => onPing(p.id)}
        >
          {pinged ? "Pinged, tap to withdraw" : "Ping to co-work"}
        </Btn>
      )}
    </div>
  );
}
