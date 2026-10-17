// Admin operations: bonus XP, bulk approval and a full JSON export.

import { getDb } from "../db/index.js";
import { applyDecision } from "@collabsphere/shared";
import { badRequest } from "../utils/errors.js";
import { listActivity, logActivity } from "./activity.js";
import { getEvent, listEvents } from "./events.js";
import { listLedger } from "./ledger.js";
import { houseTotals, societyTotals } from "./leaderboard.js";
import { toAnnouncement, toEvent, toPeer, toUser } from "../db/mappers.js";

export function award(user, { house, amount, reason }) {
  if (!house || !reason) throw badRequest("House and reason are required.", "VALIDATION");
  const delta = Number(amount) || 0;
  const db = getDb();
  db.prepare("INSERT INTO house_xp (house, xp) VALUES (?, ?) ON CONFLICT(house) DO UPDATE SET xp = xp + ?").run(house, delta, delta);
  logActivity({ kind: "admin", text: `${user.house} Secy awarded +${delta} XP to ${house}: ${reason}`, by: `${user.house} Secy`, house: user.house });
  return { house, amount: delta, xp: houseTotals()[house] || 0 };
}

export function bulkApprove(user, ids) {
  if (!Array.isArray(ids) || ids.length === 0) throw badRequest("Provide an array of event ids.", "VALIDATION");
  const db = getDb();
  const approved = [];
  ids.forEach((id) => {
    const ev = getEvent(id);
    const next = applyDecision(ev, user.house, true);
    db.prepare("UPDATE events SET status = ?, approvals = ? WHERE id = ?").run(next.status, JSON.stringify(next.approvals), id);
    logActivity({ kind: "approval", text: `${user.house} approved “${ev.title}”`, by: `${user.house} Secy`, house: user.house });
    approved.push(next);
  });
  return { count: approved.length, events: approved };
}

export function exportAll() {
  const db = getDb();
  return {
    exportedAt: new Date().toISOString(),
    users: db.prepare("SELECT * FROM users").all().map(toUser),
    events: listEvents({ status: "all" }),
    peers: db.prepare("SELECT * FROM peers").all().map(toPeer),
    houseXP: houseTotals(),
    societyXP: societyTotals(),
    ledger: listLedger(),
    announcements: db.prepare("SELECT * FROM announcements").all().map(toAnnouncement),
    activity: listActivity()
  };
}

// re-exported so a future controller can map single rows without importing the
// mapper directly
export { toEvent };
