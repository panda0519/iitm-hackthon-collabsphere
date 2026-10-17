// Time-based one-time codes for proof-of-presence check-in.
//
// The verifier derives the code from (event, 15-second window, secret). The secret is
// never hard-coded: the API uses a server-side secret (backend/src/config), and the
// offline demo mints a random per-session secret in the browser. Callers must pass it.

import { TOTP_STEP } from "./constants.js";
import { hashStr } from "./hash.js";

export function totpFor(eventId, slice, secret) {
  if (!secret) throw new Error("totpFor requires a secret");
  return String(hashStr(`${eventId}:${secret}:${slice}`) % 1000000).padStart(6, "0");
}

export const sliceAt = (ms) => Math.floor(ms / 1000 / TOTP_STEP);

/** True when `code` matches the current window or the one just before (grace). */
export function verifyTotp(eventId, code, ms, secret) {
  if (!secret) throw new Error("verifyTotp requires a secret");
  const s = sliceAt(ms);
  const c = String(code).trim();
  return c === totpFor(eventId, s, secret) || c === totpFor(eventId, s - 1, secret);
}
