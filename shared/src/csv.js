// CSV building for exports.

// Formula-injection protection: cells starting with = + - @ (or a tab/CR) are neutralised.
export function csvCell(v) {
  let s = String(v === undefined || v === null ? "" : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

export const toCSV = (rows) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n");

/** Attendance rows for one event, joined against the ledger. */
export function attendanceRows(ev, ledger) {
  const rows = [["roll_no", "name", "status", "checked_in_at", "distance_m", "photo_hash", "entry_hash"]];
  ev.rsvps.forEach((roll) => {
    const e = ledger.find((l) => l.eventId === ev.id && l.rollNo === roll);
    const status = e ? "Checked in" : ev.checkedIn.includes(roll) ? "Checked in (seed data)" : "RSVP only";
    rows.push([roll, e ? e.name : "", status, e ? e.ts : "", e ? e.distanceM : "", e ? e.photoHash : "", e ? e.hash : ""]);
  });
  return rows;
}

/** Every ledger entry as a row. */
export function ledgerRows(ledger) {
  const rows = [
    [
      "idx",
      "recorded_at",
      "event_id",
      "event",
      "roll_no",
      "name",
      "houses",
      "xp",
      "distance_m",
      "photo_hash",
      "prev_hash",
      "hash"
    ]
  ];
  ledger.forEach((e) =>
    rows.push([
      e.idx,
      e.ts,
      e.eventId,
      e.eventTitle,
      e.rollNo,
      e.name,
      e.houses.join(" + "),
      e.xp,
      e.distanceM,
      e.photoHash,
      e.prevHash,
      e.hash
    ])
  );
  return rows;
}
