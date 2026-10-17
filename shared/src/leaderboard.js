// Leaderboard ranking and level maths.

import { HOUSES, LEVELS } from "./constants.js";

/** Houses with their XP and count of live joint events, sorted by XP (desc). */
export function rankHouses(houseXP, events) {
  return HOUSES.map((h) => ({
    house: h,
    xp: houseXP[h] || 0,
    joint: events.filter(
      (e) => e.status === "APPROVED_LIVE" && e.coHostHouse && (e.primaryHouse === h || e.coHostHouse === h)
    ).length
  })).sort((a, b) => b.xp - a.xp);
}

/** Level derived from XP: { index, level, name, next, toNext, pct }. */
export function levelFor(xp) {
  let i = 0;
  LEVELS.forEach((l, idx) => {
    if (xp >= l.min) i = idx;
  });
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] || null;
  const pct = next ? Math.min(100, ((xp - cur.min) / (next.min - cur.min)) * 100) : 100;
  return { index: i, level: i + 1, name: cur.name, next, toNext: next ? next.min - xp : 0, pct };
}
