// Environment-driven configuration. Everything has a safe local default so the
// skeleton runs with no .env at all.

import { randomBytes } from "node:crypto";

export const PORT = Number(process.env.PORT) || 4000;

export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Server-side secret for rotating check-in codes. There is deliberately NO hard-coded
// default: if the operator does not set TOTP_SECRET the server mints a random one at
// boot, so codes can never be pre-computed from a value committed to the repo.
export const TOTP_SECRET = process.env.TOTP_SECRET || randomBytes(32).toString("hex");
export const TOTP_SECRET_IS_EPHEMERAL = !process.env.TOTP_SECRET;

// Session + admin-session lifetimes.
export const SESSION_TTL_H = Number(process.env.SESSION_TTL_H) || 12;
export const ADMIN_TTL_H = Number(process.env.ADMIN_TTL_H) || 4;

// Passwords are verified with PBKDF2-HMAC-SHA256. This must match the cost used when
// the verifier was written (seeded) or verification fails.
export const PBKDF2_ITERATIONS = Number(process.env.PBKDF2_ITERATIONS) || 210000;

// Seeded demo credentials. When unset the server generates strong random passwords on
// first seed and prints them once to the console (never to the page source).
export const DEMO_MEMBER_PASSWORD = process.env.DEMO_MEMBER_PASSWORD || "";
export const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || ""; // one shared value for all houses, or unset for per-house randoms

// SQLite file, relative to the backend workspace root. Use ":memory:" for tests.
export const DB_PATH = process.env.DB_PATH || "data/collabsphere.sqlite";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
