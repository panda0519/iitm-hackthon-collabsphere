// Row -> domain-object mappers. Keeps snake_case SQL names out of the rest of the
// codebase; the output shape matches what the frontend prototype uses.

const json = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const toUser = (r) => r && { rollNo: r.roll_no, name: r.name, house: r.house, xp: r.xp };

export const toEvent = (r) =>
  r && {
    id: r.id,
    title: r.title,
    category: r.category,
    city: r.city,
    venue: r.venue,
    lat: r.lat,
    lng: r.lng,
    date: r.date,
    primaryHouse: r.primary_house,
    coHostHouse: r.co_host_house || "",
    society: r.society || "None",
    xpReward: r.xp_reward,
    status: r.status,
    approvals: json(r.approvals, {}),
    rsvps: json(r.rsvps, []),
    checkedIn: json(r.checked_in, []),
    rejectReason: r.reject_reason || "",
    cancelReason: r.cancel_reason || ""
  };

export const toEntry = (r) =>
  r && {
    idx: r.idx,
    ts: r.ts,
    eventId: r.event_id,
    rollNo: r.roll_no,
    xp: r.xp,
    houses: json(r.houses, []),
    photoHash: r.photo_hash,
    distanceM: r.distance_m,
    name: r.name,
    eventTitle: r.event_title,
    society: r.society || "None",
    prevHash: r.prev_hash,
    hash: r.hash
  };

export const toPeer = (r) =>
  r && {
    id: r.id,
    name: r.name,
    house: r.house,
    level: r.level || "Foundation",
    city: r.city || "",
    lat: r.lat,
    lng: r.lng,
    status: r.status || "",
    skills: json(r.skills, [])
  };

export const toAnnouncement = (r) =>
  r && {
    id: r.id,
    title: r.title,
    body: r.body,
    audience: r.audience,
    pinned: !!r.pinned,
    authorHouse: r.author_house,
    author: r.author,
    ts: r.ts
  };

export const toActivity = (r) => r && { id: r.id, ts: r.ts, kind: r.kind, text: r.text, by: r.by, house: r.house || "" };
