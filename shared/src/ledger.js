// Tamper-evident ledger primitives.
//
// Every entry hashes the previous entry's hash, so editing any past record breaks the
// link its successor remembers. `GENESIS` is the fixed starting point. The chain uses
// SHA-256 (a real cryptographic hash) rather than a 32-bit rolling hash, so a forged
// chain cannot be produced by hand.

import { sha256Hex } from "./hash.js";

/** The immutable part of a ledger entry, in a stable key order, used for hashing. */
export function coreOf(e) {
  return {
    idx: e.idx,
    ts: e.ts,
    eventId: e.eventId,
    rollNo: e.rollNo,
    xp: e.xp,
    houses: e.houses,
    photoHash: e.photoHash,
    distanceM: e.distanceM
  };
}

export function chainHash(prev, core) {
  const body = JSON.stringify(core);
  return "sha256:" + sha256Hex(prev + "|" + body);
}

export function entryIsValid(prevHash, e) {
  return e.prevHash === prevHash && chainHash(e.prevHash, coreOf(e)) === e.hash;
}
