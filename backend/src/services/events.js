// Event lifecycle: propose, edit, approve/reject, cancel/reopen, RSVP. The approval
// state machine is the same `applyDecision` the browser uses.

import { getDb } from "../db/index.js";
import { toEvent } from "../db/mappers.js";
import { CITIES, applyDecision, hostHouses, validateEventFields } from "@collabsphere/shared";
import { badRequest, forbidden, notFound } from "../utils/errors.js";
import { nextEventId } from "../utils/ids.js";
import { logActivity } from "./activity.js";

function persist(db, ev) {
  db.prepare(
    `UPDATE events SET title=?, category=?, city=?, venue=?, lat=?, lng=?, date=?, primary_house=?, co_host_house=?,
      society=?, xp_reward=?, status=?, approvals=?, rsvps=?, checked_in=?, reject_reason=?, cancel_reason=? WHERE id=?`
  ).run(
    ev.title,
    ev.category,
    ev.city,
    ev.venue,
    ev.lat,
    ev.lng,
    ev.date,
    ev.primaryHouse,
    ev.coHostHouse || null,
    ev.society,
    ev.xpReward,
    ev.status,
    JSON.stringify(ev.approvals),
    JSON.stringify(ev.rsvps),
    JSON.stringify(ev.checkedIn),
    ev.rejectReason || null,
    ev.cancelReason || null,
    ev.id
  );
}

export function getEvent(id) {
  const ev = toEvent(getDb().prepare("SELECT * FROM events WHERE id = ?").get(id));
  if (!ev) throw notFound(`No event ${id}`, "EVENT_NOT_FOUND");
  return ev;
}

export function listEvents({ status = "APPROVED_LIVE", city, category, house, q } = {}) {
  const db = getDb();
  const clauses = [];
  const params = [];
  if (status && status !== "all") {
    clauses.push("status = ?");
    params.push(status);
  }
  if (city) {
    clauses.push("city = ?");
    params.push(city);
  }
  if (category) {
    clauses.push("category = ?");
    params.push(category);
  }
  let sql = "SELECT * FROM events";
  if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
  sql += " ORDER BY date ASC";
  let events = db.prepare(sql).all(...params).map(toEvent);
  if (house) events = events.filter((e) => hostHouses(e).includes(house));
  if (q) {
    const needle = String(q).trim().toLowerCase();
    events = events.filter((e) => `${e.id} ${e.title} ${e.venue} ${e.city} ${hostHouses(e).join(" ")}`.toLowerCase().includes(needle));
  }
  return events;
}

export function createEvent(user, payload) {
  const f = {
    title: payload.title,
    venue: payload.venue,
    dateLocal: payload.dateLocal || payload.date,
    category: payload.category || "Co-Working"
  };
  const err = validateEventFields(f);
  if (err) throw badRequest(err, "VALIDATION");

  const coHostHouse = payload.coHostHouse || "";
  if (coHostHouse === user.house) throw badRequest("The co-host must be a different house.", "VALIDATION");

  const base = CITIES[payload.city] || CITIES.Kanpur;
  const lat = typeof payload.lat === "number" ? payload.lat : base.lat + (Math.random() - 0.5) * 0.04;
  const lng = typeof payload.lng === "number" ? payload.lng : base.lng + (Math.random() - 0.5) * 0.04;
  const xpReward = Math.min(100, Math.max(10, Number(payload.xpReward) || 50));
  const solo = !coHostHouse;
  const db = getDb();
  const ev = {
    id: nextEventId(db),
    title: String(payload.title).trim(),
    category: f.category,
    city: payload.city || "Kanpur",
    venue: String(payload.venue).trim(),
    lat,
    lng,
    date: f.dateLocal,
    primaryHouse: user.house,
    coHostHouse,
    society: payload.society || "None",
    xpReward,
    approvals: solo ? { [user.house]: true } : { [user.house]: true, [coHostHouse]: false },
    status: solo ? "APPROVED_LIVE" : "PENDING_COHOST",
    rsvps: [user.rollNo],
    checkedIn: [],
    rejectReason: "",
    cancelReason: ""
  };
  db.prepare(
    `INSERT INTO events (id, title, category, city, venue, lat, lng, date, primary_house, co_host_house, society, xp_reward, status, approvals, rsvps, checked_in)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    ev.id,
    ev.title,
    ev.category,
    ev.city,
    ev.venue,
    ev.lat,
    ev.lng,
    ev.date,
    ev.primaryHouse,
    ev.coHostHouse,
    ev.society,
    ev.xpReward,
    ev.status,
    JSON.stringify(ev.approvals),
    JSON.stringify(ev.rsvps),
    JSON.stringify(ev.checkedIn)
  );
  logActivity({ kind: "event", text: `${user.house} proposed “${ev.title}”${solo ? " (solo, live immediately)" : ` with ${coHostHouse}`}`, by: user.name, house: user.house });
  return ev;
}

export function updateEvent(user, id, patch) {
  const ev = getEvent(id);
  if (!hostHouses(ev).includes(user.house)) throw forbidden("Only a host house can edit this event.", "FORBIDDEN");
  const dateLocal = patch.dateLocal || patch.date || ev.date;
  const err = validateEventFields({ title: patch.title || ev.title, venue: patch.venue || ev.venue, dateLocal });
  if (err) throw badRequest(err, "VALIDATION");

  const changedSchedule = dateLocal !== ev.date || (patch.venue && String(patch.venue).trim() !== ev.venue);
  const other = ev.primaryHouse === user.house ? ev.coHostHouse : ev.primaryHouse;
  const reapprove = !!(changedSchedule && ev.coHostHouse && ev.status === "APPROVED_LIVE" && other);

  const next = {
    ...ev,
    title: patch.title !== undefined ? String(patch.title).trim() : ev.title,
    venue: patch.venue !== undefined ? String(patch.venue).trim() : ev.venue,
    date: dateLocal,
    xpReward: patch.xpReward !== undefined ? Math.min(100, Math.max(10, Number(patch.xpReward) || ev.xpReward)) : ev.xpReward,
    society: patch.society || ev.society,
    category: patch.category || ev.category
  };
  if (reapprove) {
    next.approvals = { ...ev.approvals, [other]: false };
    next.status = "PENDING_COHOST";
  }
  persist(getDb(), next);
  logActivity({ kind: "admin", text: `${user.house} edited “${next.title}”${reapprove ? `, sent back to ${other} for approval` : ""}`, by: `${user.house} Secy`, house: user.house });
  return next;
}

export function decide(user, id, house, approve, reason) {
  const ev = getEvent(id);
  if (!hostHouses(ev).includes(house)) throw badRequest(`${house} is not a host house for this event.`, "VALIDATION");
  const after = applyDecision(ev, house, approve, reason);
  persist(getDb(), after);
  logActivity({
    kind: "approval",
    text: approve
      ? `${house} approved “${ev.title}”${after.status === "APPROVED_LIVE" ? ", now live on the map" : ""}`
      : `${house} rejected “${ev.title}”${reason ? `: ${reason}` : ""}`,
    by: `${house} Secy`,
    house
  });
  return after;
}

export function cancelEvent(user, id, reason) {
  const ev = getEvent(id);
  if (!hostHouses(ev).includes(user.house)) throw forbidden("Only a host house can cancel this event.", "FORBIDDEN");
  const next = { ...ev, status: "CANCELLED", cancelReason: reason || "" };
  persist(getDb(), next);
  logActivity({ kind: "admin", text: `${user.house} cancelled “${ev.title}”: ${reason || "no reason given"}`, by: `${user.house} Secy`, house: user.house });
  return next;
}

export function reopenEvent(user, id) {
  const ev = getEvent(id);
  if (!hostHouses(ev).includes(user.house)) throw forbidden("Only a host house can reopen this event.", "FORBIDDEN");
  const all = Object.values(ev.approvals).every(Boolean);
  const next = { ...ev, status: all ? "APPROVED_LIVE" : "PENDING_COHOST", cancelReason: "" };
  persist(getDb(), next);
  logActivity({ kind: "admin", text: `${user.house} reopened “${ev.title}”`, by: `${user.house} Secy`, house: user.house });
  return next;
}

export function setRsvp(user, id, going) {
  const ev = getEvent(id);
  const has = ev.rsvps.includes(user.rollNo);
  if (going && !has) ev.rsvps = [...ev.rsvps, user.rollNo];
  if (!going && has) ev.rsvps = ev.rsvps.filter((r) => r !== user.rollNo);
  persist(getDb(), ev);
  logActivity({ kind: "rsvp", text: `${user.name} ${going ? "RSVP'd to" : "cancelled their RSVP for"} “${ev.title}”`, by: user.name, house: user.house });
  return ev;
}
