// Authentication + secretary (admin) unlock.
//
// Trust lives here, not in the browser. Passwords are PBKDF2 verifiers, sessions and
// admin sessions are opaque random tokens with an expiry, and every protected route
// re-checks the token server-side. An attacker with DevTools can still *call* these
// endpoints, but cannot mint a session or an admin token without the credentials.

import { randomBytes } from "node:crypto";
import { getDb } from "../db/index.js";
import { toUser } from "../db/mappers.js";
import { HOUSES } from "@collabsphere/shared";
import { ADMIN_TTL_H, SESSION_TTL_H } from "../config/index.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { badRequest, conflict, unauthorized } from "../utils/errors.js";

const ROLL_RE = /^\d{2}[a-z]\d{5,8}$/;
const nowISO = () => new Date().toISOString();
const plusHours = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();
const newToken = () => randomBytes(32).toString("hex");

export const validRoll = (roll) => ROLL_RE.test(String(roll || "").trim().toLowerCase());
export const validHouse = (house) => HOUSES.includes(house);

export function signup({ rollNo, name, house, password }) {
  const roll = String(rollNo || "").trim().toLowerCase();
  const fullName = String(name || "").trim();
  if (!validRoll(roll)) throw badRequest("Enter your roll number, like 24f200142.", "BAD_ROLL");
  if (fullName.length < 2) throw badRequest("Enter your full name.", "BAD_NAME");
  if (!validHouse(house)) throw badRequest("Choose a valid house.", "BAD_HOUSE");
  if (String(password || "").length < 8) throw badRequest("Password needs at least 8 characters.", "BAD_PASSWORD");

  const db = getDb();
  const existing = db.prepare("SELECT * FROM users WHERE roll_no = ?").get(roll);
  if (existing && existing.password_hash) throw conflict("That roll number already has an account. Log in instead.", "ACCOUNT_EXISTS");

  const { salt, hash, iters } = hashPassword(password);
  if (existing) {
    // A seeded member with no password yet: attach credentials instead of duplicating.
    db.prepare("UPDATE users SET password_salt = ?, password_hash = ?, password_iters = ? WHERE roll_no = ?").run(salt, hash, iters, roll);
  } else {
    db.prepare("INSERT INTO users (roll_no, name, house, xp, password_salt, password_hash, password_iters) VALUES (?, ?, ?, 0, ?, ?, ?)").run(roll, fullName, house, salt, hash, iters);
  }
  const user = toUser(db.prepare("SELECT * FROM users WHERE roll_no = ?").get(roll));
  return { token: issueSession(user.rollNo), user };
}

export function login({ rollNo, password }) {
  const roll = String(rollNo || "").trim().toLowerCase();
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE roll_no = ?").get(roll);
  // Same error whether the account is missing or the password is wrong.
  const ok = row && verifyPassword(password, { salt: row.password_salt, hash: row.password_hash, iters: row.password_iters });
  if (!ok) throw unauthorized("Roll number or password is incorrect.", "BAD_CREDENTIALS");
  return { token: issueSession(roll), user: toUser(row) };
}

export function logout(token) {
  if (token) getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  return { ok: true };
}

/**
 * A throwaway member session for the demo's "Continue as guest". It is a real server
 * session (so the app can read data) but has no password and is NOT a secretary, so
 * it cannot approve events, award XP or audit as a house.
 */
export function guest({ house, name } = {}) {
  const h = validHouse(house) ? house : HOUSES[0];
  const db = getDb();
  let roll;
  for (let i = 0; i < 5; i++) {
    roll = `99g${String(Math.floor(Math.random() * 900000) + 100000)}`;
    if (!db.prepare("SELECT 1 FROM users WHERE roll_no = ?").get(roll)) break;
  }
  const displayName = String(name || "Guest").trim().slice(0, 40) || "Guest";
  db.prepare("INSERT INTO users (roll_no, name, house, xp, is_secretary) VALUES (?, ?, ?, 0, 0)").run(roll, displayName, h);
  const user = toUser(db.prepare("SELECT * FROM users WHERE roll_no = ?").get(roll));
  return { token: issueSession(roll), user };
}

/** Resolve a session token to a user, or null when missing/expired/unknown. */
export function userForToken(token) {
  if (!token) return null;
  const db = getDb();
  const row = db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
  if (!row || row.expires_at < nowISO()) {
    if (row) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return toUser(db.prepare("SELECT * FROM users WHERE roll_no = ?").get(row.roll_no));
}

/** Verify the calling user's house secretary password and return an admin token. */
export function unlockAdmin(user, password) {
  const db = getDb();
  const cred = db.prepare("SELECT * FROM house_admins WHERE house = ?").get(user.house);
  if (!cred) throw unauthorized("No secretary credentials are configured for this house.", "NO_ADMIN_CREDENTIALS");
  if (!verifyPassword(password, { salt: cred.salt, hash: cred.hash, iters: cred.iters })) {
    throw unauthorized("Incorrect admin password.", "BAD_ADMIN_PASSWORD");
  }
  const token = newToken();
  db.prepare("INSERT INTO admin_sessions (token, house, created_at, expires_at) VALUES (?, ?, ?, ?)").run(token, user.house, nowISO(), plusHours(ADMIN_TTL_H));
  return { token, house: user.house, expiresAt: plusHours(ADMIN_TTL_H) };
}

export function adminForToken(token) {
  if (!token) return null;
  const db = getDb();
  const row = db.prepare("SELECT * FROM admin_sessions WHERE token = ?").get(token);
  if (!row || row.expires_at < nowISO()) {
    if (row) db.prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
    return null;
  }
  return { house: row.house };
}

export function logoutAdmin(token) {
  if (token) getDb().prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
  return { ok: true };
}

function issueSession(rollNo) {
  const token = newToken();
  getDb().prepare("INSERT INTO sessions (token, roll_no, created_at, expires_at) VALUES (?, ?, ?, ?)").run(token, rollNo, nowISO(), plusHours(SESSION_TTL_H));
  return token;
}
