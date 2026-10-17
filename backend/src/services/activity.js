// Audit-trail service. Every mutation calls logActivity so the dashboard ticker
// and the Admin console's "Activity log" stay in sync.

import { getDb } from "../db/index.js";
import { toActivity } from "../db/mappers.js";
import { newId } from "../utils/ids.js";

export function logActivity({ kind, text, by, house }, db = getDb()) {
  const entry = { id: newId("ac"), ts: new Date().toISOString(), kind, text, by, house: house || null };
  db.prepare("INSERT INTO activity (id, ts, kind, text, by, house) VALUES (?, ?, ?, ?, ?, ?)").run(
    entry.id,
    entry.ts,
    entry.kind,
    entry.text,
    entry.by,
    entry.house
  );
  return toActivity(entry);
}

export function listActivity({ kind, limit } = {}) {
  const db = getDb();
  const clauses = [];
  const params = [];
  if (kind && kind !== "all") {
    clauses.push("kind = ?");
    params.push(kind);
  }
  let sql = "SELECT * FROM activity";
  if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
  sql += " ORDER BY ts DESC";
  if (limit) {
    sql += " LIMIT ?";
    params.push(Number(limit));
  }
  return db.prepare(sql).all(...params).map(toActivity);
}

export function activityRows() {
  const rows = [["time", "kind", "by", "house", "text"]];
  listActivity().forEach((x) => rows.push([x.ts, x.kind, x.by, x.house, x.text]));
  return rows;
}
