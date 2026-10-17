// Hashing helpers.
//
// SHA-256 is the real primitive here: the admin fingerprint, account passwords and
// the ledger chain all use it. FNV-1a 32-bit is kept only for the tiny `shortHash`
// display tag (member passes, UI labels) where the value is cosmetic, never a proof.

import { ADMIN_SALT, ADMIN_HASH } from "./constants.js";

// FNV-1a 32-bit.
export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const hex8 = (n) => n.toString(16).padStart(8, "0").toUpperCase();
export const shortHash = (s) => "0x" + hex8(hashStr(s));

// Small dependency-free SHA-256 (works on file://, http and https alike).
// Guarded so it can run in both the browser and Node (via globalThis).
// Accepts either a string or raw bytes (Uint8Array), so the same routine hashes
// text (passwords, ledger bodies) and binary files (check-in photos).
export function sha256Hex(data) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const K = [],
    H = [];
  const frac = (x) => ((x - Math.floor(x)) * 4294967296) | 0;
  for (let n = 2, found = 0; found < 64; n++) {
    let prime = true;
    for (let d = 2; d * d <= n; d++)
      if (n % d === 0) {
        prime = false;
        break;
      }
    if (!prime) continue;
    if (found < 8) H[found] = frac(Math.sqrt(n));
    K[found++] = frac(Math.cbrt(n));
  }
  const len = bytes.length;
  const total = ((len + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(total);
  buf.set(bytes);
  buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, Math.floor((len * 8) / 4294967296));
  dv.setUint32(total - 4, (len * 8) >>> 0);
  const w = new Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c)) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

/** Configured admin password check. Browser-side lock only; see REFACTOR_NOTES.md. */
export const checkAdminPassword = (pw) => sha256Hex(ADMIN_SALT + ":" + pw) === ADMIN_HASH;

/**
 * Content fingerprint for a check-in photo. Hashes the actual image bytes (not the
 * file name/size/date), so renaming or re-dating a file no longer reuses a photo.
 * Returns a "sha256:<hex>" tag that is stable for identical bytes.
 */
export function photoFingerprint(data) {
  let bytes;
  if (data instanceof Uint8Array) bytes = data;
  else if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) bytes = new Uint8Array(data);
  else if (data && typeof data.arrayBuffer === "function") return data.arrayBuffer().then((b) => photoFingerprint(new Uint8Array(b)));
  else bytes = new TextEncoder().encode(String(data));
  return "sha256:" + sha256Hex(bytes);
}
