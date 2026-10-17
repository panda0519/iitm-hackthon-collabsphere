import { Fragment } from "react";
import { HouseChip } from "../ui/HouseChip.jsx";
import { Icon } from "../ui/Icon.jsx";
import { Btn } from "../ui/Btn.jsx";
import { copyText } from "../../services/clipboard.js";
import { downloadText } from "../../services/download.js";
import { toICS } from "../../services/calendar.js";
import { hostHouses, housesLabel, prettyDate, relLabel } from "@collabsphere/shared";

// Floating detail card shown over the map.
export function SelectedEventCard({ ev, user, onClose, onRsvp, onCheckIn, notify }) {
  const going = ev.rsvps.includes(user.rollNo);
  const when = relLabel(ev.date);
  const share = async () => {
    const ok = await copyText(
      `${ev.title}\n${housesLabel(ev)}\n${prettyDate(ev.date)} at ${ev.venue}\nJoin on CollabSphere (${ev.id})`
    );
    notify(ok ? "Event details copied." : "Couldn't copy. Select the text and copy it by hand.", ok ? "ok" : "error");
  };
  const addToCalendar = () => {
    downloadText(`${ev.id}.ics`, toICS(ev));
    notify("Calendar file downloaded.");
  };
  return (
    <div className="pointer-events-auto pop-in w-full max-w-md glass rounded-2xl p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {hostHouses(ev).map((h, i) => (
              <Fragment key={h}>
                {i > 0 && <span className="text-[11px] text-mu">with</span>}
                <HouseChip house={h} />
              </Fragment>
            ))}
          </div>
          <h3 className="font-display font-bold text-lg leading-snug text-tx mt-1">{ev.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg text-mu hover:text-tx hover:bg-s2 flex items-center justify-center shrink-0"
          aria-label="Close event details"
        >
          <Icon name="x" />
        </button>
      </div>
      <div className="mt-2 grid gap-1 text-xs text-mu">
        <div className="flex items-center gap-2">
          <Icon name="clock" className="w-3.5 h-3.5" />
          <span>
            {prettyDate(ev.date)}
            {when ? `, ${when.toLowerCase()}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Icon name="pin" className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{ev.venue}</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="users" className="w-3.5 h-3.5" />
          <span>
            {ev.rsvps.length} going, {ev.checkedIn.length} checked in
            {ev.society !== "None" ? `, backed by ${ev.society}` : ""}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Btn size="sm" variant={going ? "soft" : "primary"} icon={going ? "check" : "plus"} onClick={() => onRsvp(ev.id)}>
          {going ? "Going" : "RSVP"}
        </Btn>
        <Btn size="sm" variant="soft" icon="shield" onClick={() => onCheckIn(ev.id)}>
          Check in
        </Btn>
        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={addToCalendar}
            className="w-8 h-8 rounded-lg text-mu hover:text-tx hover:bg-s2 flex items-center justify-center"
            aria-label="Add to calendar"
            title="Add to calendar"
          >
            <Icon name="calendar" />
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${ev.lat},${ev.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg text-mu hover:text-tx hover:bg-s2 flex items-center justify-center"
            aria-label="Get directions"
            title="Get directions"
          >
            <Icon name="nav" />
          </a>
          <button
            type="button"
            onClick={share}
            className="w-8 h-8 rounded-lg text-mu hover:text-tx hover:bg-s2 flex items-center justify-center"
            aria-label="Copy event details"
            title="Copy event details"
          >
            <Icon name="share" />
          </button>
        </span>
      </div>
      <div className="text-[11px] text-ok font-semibold mt-2">+{ev.xpReward} XP for each host house</div>
    </div>
  );
}
