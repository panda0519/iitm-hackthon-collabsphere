// Id helpers. Event ids keep the client's EVT-### shape so both sides look alike.

export function newId(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

export function nextEventId(db) {
  const row = db.prepare("SELECT MAX(CAST(substr(id, 5) AS INTEGER)) AS n FROM events WHERE id LIKE 'EVT-%'").get();
  const max = Math.max(100, row && row.n ? row.n : 0);
  return `EVT-${max + 1}`;
}
