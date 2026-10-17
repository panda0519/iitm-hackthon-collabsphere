// Password hashing for the API. PBKDF2-HMAC-SHA256 with a per-user random salt.
//
// Verification is constant-time (timingSafeEqual) so a wrong password cannot be
// distinguished from a right one by response time. Plaintext passwords are never
// stored, logged or returned.

import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { PBKDF2_ITERATIONS } from "../config/index.js";

const KEY_LEN = 32;

/** Returns { salt, hash, iters, algo } suitable for storage. */
export function hashPassword(password, iters = PBKDF2_ITERATIONS) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(String(password), salt, iters, KEY_LEN, "sha256").toString("hex");
  return { salt, hash, iters, algo: "pbkdf2-sha256" };
}

/** Constant-time check of `password` against a stored verifier. */
export function verifyPassword(password, { salt, hash, iters }) {
  if (!salt || !hash) return false;
  const computed = pbkdf2Sync(String(password), salt, Number(iters) || PBKDF2_ITERATIONS, KEY_LEN, "sha256");
  const expected = Buffer.from(hash, "hex");
  return computed.length === expected.length && timingSafeEqual(computed, expected);
}

/** A strong random password for seeded demo credentials. */
export const randomPassword = () => randomBytes(9).toString("base64url");
