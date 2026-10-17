import { Btn } from "../ui/Btn.jsx";
import { Icon } from "../ui/Icon.jsx";

export const TOUR = [
  {
    tab: "dashboard",
    title: "Your command centre",
    body: "Rank, XP, the house race, a 14-day event radar and a countdown to the next meetup you RSVP'd to. Move your pointer over the member pass."
  },
  {
    tab: "map",
    title: "Find a meetup near you",
    body: "Pick a city or drop a pin, then widen the radius. A pin splits into two colours when two houses host together."
  },
  {
    tab: "host",
    title: "Host with another house",
    body: "Propose an event and track it here. The co-host house secretary approves or rejects it in the Admin console before it reaches the map."
  },
  {
    tab: "checkin",
    title: "Prove you were there",
    body: "Three checks decide a check-in: the live code, the 150 m geofence and a fresh venue photo. Use the rehearsal controls to fail each one."
  },
  {
    tab: "leaderboard",
    title: "Every check-in is chained",
    body: "Each ledger entry stores the hash of the one before it. Run the audit, tamper with entry #1, then audit again."
  },
  {
    tab: "admin",
    title: "Run the house from one console",
    body: "Approve in bulk, reject with a reason, edit events, post announcements, award XP and export CSVs. Every action lands in the audit trail."
  }
];

export function TourCard({ step, onPrev, onNext, onClose }) {
  const s = TOUR[step];
  return (
    <div className="fixed inset-x-0 z-[800] bottom-28 lg:bottom-6 flex justify-center px-3 pointer-events-none">
      <div className="pointer-events-auto pop-in w-full max-w-[460px] glass rounded-2xl p-4 shadow-2xl" role="dialog" aria-label="Guided tour">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] text-mu">
              Step {step + 1} of {TOUR.length}
            </div>
            <h3 className="font-display font-bold text-base text-tx mt-0.5">{s.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-mu hover:text-tx hover:bg-s2 flex items-center justify-center shrink-0"
            aria-label="Skip the tour"
          >
            <Icon name="x" />
          </button>
        </div>
        <p className="text-xs text-mu mt-1.5 leading-relaxed">{s.body}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1.5">
            {TOUR.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-pri" : "w-1.5 bg-line"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <Btn size="sm" variant="ghost" onClick={onPrev} disabled={step === 0}>
              Back
            </Btn>
            <Btn size="sm" variant="primary" onClick={onNext}>
              {step === TOUR.length - 1 ? "Done" : "Next"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
