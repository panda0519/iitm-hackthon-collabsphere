// Every method takes just the event, matching the original toICS. The 2-hour length
// is fixed, as before.
import { p2, parseEventDate, housesLabel } from "@collabsphere/shared";

export function toICS(ev) {
  const d = parseEventDate(ev.date) || new Date();
  const end = new Date(d.getTime() + 2 * 3600 * 1000);
  const f = (x) =>
    `${x.getFullYear()}${p2(x.getMonth() + 1)}${p2(x.getDate())}T${p2(x.getHours())}${p2(x.getMinutes())}00`;
  const esc = (s) =>
    String(s)
      .replace(/([,;\\])/g, "\\$1")
      .replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CollabSphere//Prototype//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@collabsphere.local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${f(d)}`,
    `DTEND:${f(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    `LOCATION:${esc(ev.venue)}`,
    `DESCRIPTION:${esc(`Hosted by ${housesLabel(ev)}. +${ev.xpReward} XP for each host house.`)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}
