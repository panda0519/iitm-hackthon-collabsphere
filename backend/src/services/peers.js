// Peer presence ("go live" on the map) and pings.

import { getDb } from "../db/index.js";
import { toPeer } from "../db/mappers.js";
import { haversineDistance } from "@collabsphere/shared";

export function listPeers(_user, { city, radiusKm, lat, lng } = {}) {
  const db = getDb();
  let peers = db.prepare("SELECT * FROM peers").all().map(toPeer);
  if (city) peers = peers.filter((p) => p.city === city);
  if (radiusKm && typeof lat === "number" && typeof lng === "number") {
    peers = peers.filter((p) => haversineDistance(lat, lng, p.lat, p.lng) <= Number(radiusKm));
  }
  const pings = new Set(db.prepare("SELECT peer_id FROM pings").all().map((r) => r.peer_id));
  return peers.map((p) => ({ ...p, pinged: pings.has(p.id) }));
}

export function goLive(user, payload) {
  const db = getDb();
  db.prepare(
    `INSERT INTO peers (id, name, house, level, city, lat, lng, status, skills) VALUES ('me', ?, ?, 'Degree', ?, ?, ?, ?, '[]')
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, house = excluded.house, city = excluded.city,
       lat = excluded.lat, lng = excluded.lng, status = excluded.status`
  ).run(user.name, user.house, payload.city || "", Number(payload.lat), Number(payload.lng), payload.status || "Open to co-work");
  return toPeer(db.prepare("SELECT * FROM peers WHERE id = 'me'").get());
}

export function goOffline() {
  getDb().prepare("DELETE FROM peers WHERE id = 'me'").run();
  return { online: false };
}

export function togglePing(_user, peerId) {
  const db = getDb();
  const existing = db.prepare("SELECT 1 FROM pings WHERE peer_id = ?").get(peerId);
  if (existing) db.prepare("DELETE FROM pings WHERE peer_id = ?").run(peerId);
  else db.prepare("INSERT INTO pings (peer_id) VALUES (?)").run(peerId);
  return { peerId, pinged: !existing };
}
