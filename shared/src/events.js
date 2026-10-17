// Event business rules and analytics. No React, no DOM.
// In production these become server-side services/route handlers.

import { p2, parseEventDate } from "./dates.js";

/** The list of houses that host an event (1 or 2). */
export const hostHouses = (ev) => [ev.primaryHouse, ev.coHostHouse].filter(Boolean);

/** Human label for the host houses, e.g. "Bandipur × Saranda". */
export const housesLabel = (ev) => (ev.coHostHouse ? `${ev.primaryHouse} × ${ev.coHostHouse}` : ev.primaryHouse);

/** Returns an error message, or null when the fields are valid. */
export function validateEventFields(f) {
  if (!f.title || f.title.trim().length < 4) return "Give the event a title of at least 4 characters.";
  if (!f.venue || f.venue.trim().length < 3) return "Add a venue name.";
  if (!f.dateLocal) return "Pick a date and time.";
  return null;
}

/** One house's decision on an event; returns the updated event. */
export function applyDecision(ev, house, approve, reason) {
  if (!approve)
    return { ...ev, approvals: { ...ev.approvals, [house]: false }, status: "REJECTED", rejectReason: reason || "" };
  const approvals = { ...ev.approvals, [house]: true };
  return { ...ev, approvals, status: Object.values(approvals).every(Boolean) ? "APPROVED_LIVE" : "PENDING_COHOST" };
}

/** n consecutive days starting today, each with the live events that fall on it. */
export function radarDays(events, n = 14) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
    out.push({ key, date: d, events: events.filter((e) => e.status === "APPROVED_LIVE" && String(e.date).startsWith(key)) });
  }
  return out;
}

/** The soonest live event the member has RSVP'd to and that has not long passed. */
export function nextRsvpEvent(events, rollNo) {
  const cutoff = Date.now() - 3 * 3600e3;
  const list = events
    .filter((e) => e.status === "APPROVED_LIVE" && e.rsvps.includes(rollNo))
    .map((e) => ({ ev: e, t: (parseEventDate(e.date) || new Date(0)).getTime() }))
    .filter((x) => x.t > cutoff)
    .sort((a, b) => a.t - b.t);
  return list.length ? list[0] : null;
}
