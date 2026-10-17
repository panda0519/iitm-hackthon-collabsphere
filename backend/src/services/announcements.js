// Announcements. Members see ones addressed to their house or to everyone.

import { getDb } from "../db/index.js";
import { toAnnouncement } from "../db/mappers.js";
import { forbidden, notFound } from "../utils/errors.js";
import { logActivity } from "./activity.js";

export function listAnnouncements(user) {
  return getDb()
    .prepare("SELECT * FROM announcements")
    .all()
    .map(toAnnouncement)
    .filter((a) => a.audience === "All" || a.audience === user.house)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.ts) - new Date(a.ts));
}

export function createAnnouncement(user, payload) {
  const item = {
    id: `an${Date.now()}`,
    title: String(payload.title).trim(),
    body: String(payload.body).trim(),
    audience: payload.audience || "All",
    pinned: payload.pinned ? 1 : 0,
    authorHouse: user.house,
    author: `${user.house} Secy`,
    ts: new Date().toISOString()
  };
  getDb()
    .prepare("INSERT INTO announcements (id, title, body, audience, pinned, author_house, author, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(item.id, item.title, item.body, item.audience, item.pinned, item.authorHouse, item.author, item.ts);
  logActivity({ kind: "admin", text: `${user.house} posted “${item.title}” to ${item.audience === "All" ? "all houses" : item.audience}`, by: `${user.house} Secy`, house: user.house });
  return toAnnouncement(item);
}

export function updateAnnouncement(user, id, patch) {
  const an = toAnnouncement(getDb().prepare("SELECT * FROM announcements WHERE id = ?").get(id));
  if (!an) throw notFound(`No announcement ${id}`, "ANNOUNCEMENT_NOT_FOUND");
  if (an.authorHouse !== user.house) throw forbidden("Only the author house can edit this announcement.", "FORBIDDEN");
  const pinned = patch.pinned === undefined ? Number(an.pinned) : patch.pinned ? 1 : 0;
  getDb().prepare("UPDATE announcements SET pinned = ? WHERE id = ?").run(pinned, id);
  return { ...an, pinned: !!pinned };
}

export function deleteAnnouncement(user, id) {
  const an = toAnnouncement(getDb().prepare("SELECT * FROM announcements WHERE id = ?").get(id));
  if (!an) throw notFound(`No announcement ${id}`, "ANNOUNCEMENT_NOT_FOUND");
  if (an.authorHouse !== user.house) throw forbidden("Only the author house can delete this announcement.", "FORBIDDEN");
  getDb().prepare("DELETE FROM announcements WHERE id = ?").run(id);
  logActivity({ kind: "admin", text: `${user.house} deleted the announcement “${an.title}”`, by: `${user.house} Secy`, house: user.house });
  return { deleted: true };
}
