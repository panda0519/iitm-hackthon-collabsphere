// Standings. Uses the same rankHouses rule as the browser.

import { getDb } from "../db/index.js";
import { rankHouses } from "@collabsphere/shared";
import { listEvents } from "./events.js";

function totals(table, key) {
  const out = {};
  getDb()
    .prepare(`SELECT * FROM ${table}`)
    .all()
    .forEach((r) => {
      out[r[key]] = r.xp;
    });
  return out;
}

export const houseTotals = () => totals("house_xp", "house");
export const societyTotals = () => totals("society_xp", "society");

export function leaderboard() {
  const events = listEvents({ status: "all" });
  const houses = rankHouses(houseTotals(), events);
  const societies = Object.entries(societyTotals())
    .map(([name, xp]) => ({ name, xp }))
    .sort((a, b) => b.xp - a.xp);
  return { houses, societies };
}
