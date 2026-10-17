// Date formatting. Event dates are stored as a display string: "2026-10-18 • 4:00 PM".

export const p2 = (x) => String(x).padStart(2, "0");

/** Turn a <input type="datetime-local"> value into the app's stored date string. */
export function fmtDateTime(local) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(local || "");
  if (!m) return local;
  const h24 = Number(m[2]);
  return `${m[1]} • ${h24 % 12 || 12}:${m[3]} ${h24 >= 12 ? "PM" : "AM"}`;
}

/** Parse the stored date string back into a Date, or null. */
export function parseEventDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})\s*[•·]\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(str || "").trim());
  if (!m) return null;
  let h = Number(m[4]) % 12;
  if (m[6].toUpperCase() === "PM") h += 12;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h, Number(m[5]));
}

export const time12 = (d) => `${d.getHours() % 12 || 12}:${p2(d.getMinutes())} ${d.getHours() >= 12 ? "PM" : "AM"}`;

export function prettyDate(str) {
  const d = parseEventDate(str);
  if (!d) return str;
  return `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}, ${time12(d)}`;
}

export function relLabel(str) {
  const d = parseEventDate(str);
  if (!d) return "";
  const now = new Date();
  const diff = d - now;
  if (diff < 0) return diff > -3 * 3600e3 ? "Happening now" : "Past";
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `In ${mins} min`;
  const sod = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((sod(d) - sod(now)) / 86400000);
  if (days === 0) return `Today, ${time12(d)}`;
  if (days === 1) return "Tomorrow";
  if (days <= 30) return `In ${days} days`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Seed dates are relative to today so the demo never looks stale.
export function inDays(n, h, m) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} • ${h % 12 || 12}:${p2(m)} ${h >= 12 ? "PM" : "AM"}`;
}

export function inDaysLocal(n, h, m) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(h)}:${p2(m)}`;
}

/** The stored date string as a <input type="datetime-local"> value. */
export function toLocalInput(str) {
  const d = parseEventDate(str);
  return d ? `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}` : "";
}

/** An ISO timestamp `hours` in the past, used for seed data. */
export function agoISO(hours) {
  return new Date(Date.now() - hours * 3600e3).toISOString();
}

export function agoLabel(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
