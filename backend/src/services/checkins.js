// Check-in verification. The server is the clock and the source of truth: it
// derives the code, checks the geofence and appends the ledger entry, then credits
// XP to every host house and the backing society.

import { getDb } from "../db/index.js";
import { toEntry, toUser } from "../db/mappers.js";
import { GEOFENCE_M, TOTP_STEP, chainHash, coreOf, haversineDistance, hostHouses, levelFor, sliceAt, totpFor, verifyTotp } from "@collabsphere/shared";
import { TOTP_SECRET } from "../config/index.js";
import { badRequest, conflict, notFound } from "../utils/errors.js";
import { logActivity } from "./activity.js";
import { appendEntry, listLedger } from "./ledger.js";
import { getEvent } from "./events.js";

/** The code shown on the host screen, plus how long until it rotates. */
export function currentCode(eventId) {
  getEvent(eventId); // 404s on an unknown event
  const now = Date.now();
  const msLeft = TOTP_STEP * 1000 - (now % (TOTP_STEP * 1000));
  return { code: totpFor(eventId, sliceAt(now), TOTP_SECRET), secondsLeft: Math.ceil(msLeft / 1000) };
}

export function claimCheckIn(user, payload) {
  const { eventId, code, lat, lng, photoHash } = payload;
  const ev = getEvent(eventId);
  if (ev.status !== "APPROVED_LIVE") throw badRequest("This event is not live.", "EVENT_NOT_LIVE");
  if (!ev.rsvps.includes(user.rollNo)) throw badRequest("RSVP to this event first, then check in.", "RSVP_REQUIRED");
  if (ev.checkedIn.includes(user.rollNo)) throw conflict("You have already checked in to this event.", "ALREADY_CHECKED_IN");

  if (!verifyTotp(eventId, code, Date.now(), TOTP_SECRET))
    throw badRequest("That code is wrong or has expired. Codes change every 15 seconds.", "BAD_CODE");

  if (typeof lat !== "number" || typeof lng !== "number") throw badRequest("Location is required.", "VALIDATION");
  const distanceM = Math.round(haversineDistance(lat, lng, ev.lat, ev.lng) * 1000);
  if (distanceM > GEOFENCE_M) throw badRequest(`Geofence violation: you are ${distanceM} m from ${ev.venue}. Limit is ${GEOFENCE_M} m.`, "OUT_OF_GEOFENCE");

  if (!photoHash) throw badRequest("A venue photo hash is required.", "VALIDATION");
  const db = getDb();
  const reused = db.prepare("SELECT 1 FROM ledger WHERE photo_hash = ? LIMIT 1").get(photoHash);
  if (reused) throw conflict("This photo was already used for an earlier check-in.", "PHOTO_REUSED");

  const entries = listLedger();
  const prevHash = entries.length ? entries[entries.length - 1].hash : "GENESIS";
  const houses = hostHouses(ev);
  const core = {
    idx: entries.length + 1,
    ts: new Date().toISOString(),
    eventId: ev.id,
    rollNo: user.rollNo,
    xp: ev.xpReward,
    houses,
    photoHash,
    distanceM
  };
  const entry = { ...core, name: user.name, eventTitle: ev.title, society: ev.society, prevHash, hash: chainHash(prevHash, coreOf(core)) };

  const before = levelFor(user.xp);
  const after = levelFor(user.xp + ev.xpReward);

  db.exec("BEGIN");
  try {
    appendEntry(db, entry);
    db.prepare("UPDATE events SET checked_in = ? WHERE id = ?").run(JSON.stringify([...ev.checkedIn, user.rollNo]), ev.id);
    db.prepare("UPDATE users SET xp = xp + ? WHERE roll_no = ?").run(ev.xpReward, user.rollNo);
    houses.forEach((h) => db.prepare("INSERT INTO house_xp (house, xp) VALUES (?, ?) ON CONFLICT(house) DO UPDATE SET xp = xp + ?").run(h, ev.xpReward, ev.xpReward));
    if (ev.society && ev.society !== "None") {
      db.prepare("INSERT INTO society_xp (society, xp) VALUES (?, ?) ON CONFLICT(society) DO UPDATE SET xp = xp + ?").run(ev.society, ev.xpReward, ev.xpReward);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    if (String(e.message || "").includes("UNIQUE")) throw conflict("You have already checked in to this event.", "ALREADY_CHECKED_IN");
    throw e;
  }

  logActivity({ kind: "checkin", text: `${user.name} checked in to “${ev.title}” (+${ev.xpReward} XP for ${houses.join(" and ")})`, by: user.name, house: user.house });

  return { entry, levelUp: after.index > before.index ? { name: after.name } : null, distanceM };
}

export function userById(rollNo) {
  const user = toUser(getDb().prepare("SELECT * FROM users WHERE roll_no = ?").get(rollNo));
  if (!user) throw notFound("No such member.", "USER_NOT_FOUND");
  return user;
}

export { toEntry };
