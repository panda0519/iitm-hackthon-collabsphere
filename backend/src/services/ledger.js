// Ledger reads, chain audit and CSV export.

import { getDb } from "../db/index.js";
import { toEntry } from "../db/mappers.js";
import { entryIsValid, ledgerRows } from "@collabsphere/shared";

export function listLedger() {
  return getDb().prepare("SELECT * FROM ledger ORDER BY idx ASC").all().map(toEntry);
}

export function appendEntry(db, entry) {
  db.prepare(
    `INSERT INTO ledger (ts, event_id, roll_no, xp, houses, photo_hash, distance_m, name, event_title, society, prev_hash, hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    entry.ts,
    entry.eventId,
    entry.rollNo,
    entry.xp,
    JSON.stringify(entry.houses),
    entry.photoHash,
    entry.distanceM,
    entry.name,
    entry.eventTitle,
    entry.society,
    entry.prevHash,
    entry.hash
  );
}

/** Walk the chain from GENESIS; returns { ok, brokenAt }. */
export function auditLedger() {
  const entries = listLedger();
  let prev = "GENESIS";
  for (let i = 0; i < entries.length; i++) {
    if (!entryIsValid(prev, entries[i])) return { ok: false, brokenAt: i };
    prev = entries[i].hash;
  }
  return { ok: true, brokenAt: null };
}

export function ledgerCsvRows() {
  return ledgerRows(listLedger());
}
