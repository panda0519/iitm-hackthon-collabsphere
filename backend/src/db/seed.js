// Demo seed. Mirrors frontend/src/data/seed.js so the API starts with the same
// world the prototype shows. Dates are relative to "now" so the demo never looks
// stale.
//
// It also seeds credentials: the demo member's password and one secretary password
// per house. Passwords are PBKDF2 verifiers only. When no password is supplied via
// env the server generates a strong random one on first seed and prints it once to
// the console — credentials never live in the page source.

import { inDays, agoISO, HOUSES } from "@collabsphere/shared";
import { hashPassword, randomPassword } from "../utils/password.js";
import { DEMO_ADMIN_PASSWORD, DEMO_MEMBER_PASSWORD } from "../config/index.js";

export const DEMO_ROLL_NO = "24f200142";

const USERS = [{ rollNo: DEMO_ROLL_NO, name: "乛卩ムNDム", house: "Bandipur", xp: 210 }];

const HOUSE_XP = {
  Saranda: 640,
  Gir: 600,
  Namdapha: 580,
  Corbett: 520,
  Bandipur: 470,
  Kanha: 455,
  Pichavaram: 410,
  Kaziranga: 390,
  Wayanad: 275
};

const SOCIETY_XP = {
  "Code Crafters": 360,
  "Paradox Tech Society": 320,
  "boundless AI Club": 280,
  "Sahitya Literary Guild": 150,
  "Raaga Music Society": 190
};

const PEERS = [
  { id: "p1", name: "Aarav Verma", house: "Bandipur", level: "Diploma", city: "Kanpur", lat: 26.461, lng: 80.345, status: "Down for DSA & C++ Co-working", skills: ["C++", "PyTorch"] },
  { id: "p2", name: "Sneha Nair", house: "Namdapha", level: "Degree", city: "Kanpur", lat: 26.438, lng: 80.319, status: "Studying ML Foundations @ Cafe", skills: ["ML", "Python"] },
  { id: "p3", name: "Rohan Iyer", house: "Kanha", level: "Diploma", city: "Bengaluru", lat: 12.978, lng: 77.605, status: "Building Hackathon Prototype", skills: ["Next.js", "FastAPI"] },
  { id: "p4", name: "Divya Krishnan", house: "Corbett", level: "Degree", city: "Chennai", lat: 12.9915, lng: 80.2337, status: "At IITM Research Park Library", skills: ["Data Science", "SQL"] },
  { id: "p5", name: "Kabir Sharma", house: "Kaziranga", level: "Foundation", city: "Delhi", lat: 28.628, lng: 77.219, status: "Weekend Mock Viva Prep", skills: ["Python", "Stats"] },
  { id: "p6", name: "Meera Pillai", house: "Pichavaram", level: "Degree", city: "Chennai", lat: 13.01, lng: 80.23, status: "Design sprint co-working", skills: ["UI/UX", "Figma"] },
  { id: "p7", name: "Arjun Rao", house: "Saranda", level: "Diploma", city: "Kanpur", lat: 26.456, lng: 80.355, status: "DevOps lab @ Civil Lines", skills: ["Go", "Docker"] }
];

const EVENTS = [
  { id: "EVT-101", title: "Kanpur Algorithm & System Design Jam", category: "Co-Working", city: "Kanpur", venue: "Swaroop Nagar Co-Work Hub, Kanpur", lat: 26.472, lng: 80.322, date: inDays(4, 16, 0), primaryHouse: "Bandipur", coHostHouse: "Saranda", society: "Code Crafters", xpReward: 50, approvals: { Bandipur: true, Saranda: true }, status: "APPROVED_LIVE", rsvps: ["24f200142", "23f100891", "24f300112"], checkedIn: ["23f100891"] },
  { id: "EVT-102", title: "Cross-House Deep Learning Paper Reading", category: "Joint Meetup", city: "Kanpur", venue: "Kakadeo Study Lounge, Kanpur", lat: 26.4685, lng: 80.2995, date: inDays(7, 17, 30), primaryHouse: "Bandipur", coHostHouse: "Kanha", society: "boundless AI Club", xpReward: 75, approvals: { Bandipur: true, Kanha: false }, status: "PENDING_COHOST", rsvps: ["24f200142"], checkedIn: [] },
  { id: "EVT-103", title: "Bengaluru Indiranagar Sunday Code & Coffee", category: "Co-Working", city: "Bengaluru", venue: "Third Wave Coffee, Indiranagar", lat: 12.9784, lng: 77.6408, date: inDays(5, 11, 0), primaryHouse: "Namdapha", coHostHouse: "Corbett", society: "None", xpReward: 40, approvals: { Namdapha: true, Corbett: true }, status: "APPROVED_LIVE", rsvps: ["22f300410", "23f200511"], checkedIn: [] },
  { id: "EVT-104", title: "Chennai Guindy Pre-Paradox Mixer", category: "Regional Meetup", city: "Chennai", venue: "IITM Research Park Food Court", lat: 12.9902, lng: 80.2419, date: inDays(11, 15, 0), primaryHouse: "Corbett", coHostHouse: "Bandipur", society: "Raaga Music Society", xpReward: 60, approvals: { Corbett: true, Bandipur: true }, status: "APPROVED_LIVE", rsvps: ["23f100222"], checkedIn: [] },
  { id: "EVT-105", title: "Delhi Weekend Hackathon Buddy-Up", category: "Joint Meetup", city: "Delhi", venue: "Connaught Place Co-Work Studio, Delhi", lat: 28.6315, lng: 77.2167, date: inDays(9, 10, 30), primaryHouse: "Kaziranga", coHostHouse: "Bandipur", society: "Code Crafters", xpReward: 80, approvals: { Kaziranga: true, Bandipur: false }, status: "PENDING_COHOST", rsvps: [], checkedIn: [] },
  { id: "EVT-106", title: "Chennai Adyar Study Sprint", category: "Co-Working", city: "Chennai", venue: "Adyar Community Library, Chennai", lat: 13.0067, lng: 80.2575, date: inDays(2, 10, 0), primaryHouse: "Wayanad", coHostHouse: "Pichavaram", society: "boundless AI Club", xpReward: 45, approvals: { Wayanad: true, Pichavaram: true }, status: "APPROVED_LIVE", rsvps: ["23f100333"], checkedIn: [] },
  { id: "EVT-107", title: "Kanpur Quiet Hours Co-Working", category: "Co-Working", city: "Kanpur", venue: "Civil Lines Reading Room, Kanpur", lat: 26.473, lng: 80.35, date: inDays(1, 18, 0), primaryHouse: "Saranda", coHostHouse: "", society: "None", xpReward: 30, approvals: { Saranda: true }, status: "APPROVED_LIVE", rsvps: [], checkedIn: [] }
];

const ANNOUNCEMENTS = [
  { id: "an1", title: "Welcome to CollabSphere", body: "Propose a joint event with another house, get it approved, then check in on the day with a live code to earn XP for both houses.", audience: "All", pinned: 1, authorHouse: "Bandipur", author: "Bandipur Secy", ts: agoISO(26) },
  { id: "an2", title: "Bandipur: RSVP early", body: "Regional meetups fill up fast. RSVP in the Discover tab so your seat is counted.", audience: "Bandipur", pinned: 0, authorHouse: "Bandipur", author: "Bandipur Secy", ts: agoISO(52) },
  { id: "an3", title: "Gir: planning call this week", body: "Gir secretaries are collecting joint-event ideas. Send yours to your secretary before the call.", audience: "Gir", pinned: 0, authorHouse: "Gir", author: "Gir Secy", ts: agoISO(70) }
];

const ACTIVITY = [
  { id: "ac1", ts: agoISO(3), kind: "approval", text: "Namdapha and Corbett's Bengaluru Code & Coffee went live", by: "Corbett Secy", house: "Corbett" },
  { id: "ac2", ts: agoISO(20), kind: "event", text: "Kaziranga proposed “Delhi Weekend Hackathon Buddy-Up” with Bandipur", by: "Kaziranga Secy", house: "Kaziranga" },
  { id: "ac3", ts: agoISO(45), kind: "approval", text: "Saranda and Bandipur's Kanpur Algorithm Jam went live", by: "Saranda Secy", house: "Saranda" },
  { id: "ac4", ts: agoISO(60), kind: "checkin", text: "A member checked in to the Kanpur Algorithm Jam (+50 XP)", by: "Member", house: "Saranda" }
];

export function seed(db) {
  const credentials = { member: null, admins: {} };

  const memberPassword = DEMO_MEMBER_PASSWORD || randomPassword();
  const m = hashPassword(memberPassword);
  credentials.member = { rollNo: DEMO_ROLL_NO, password: memberPassword };
  const insertUser = db.prepare(
    "INSERT INTO users (roll_no, name, house, xp, password_salt, password_hash, password_iters, is_secretary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  USERS.forEach((u) => insertUser.run(u.rollNo, u.name, u.house, u.xp, m.salt, m.hash, m.iters, 1));

  // One secretary credential per house. A single shared DEMO_ADMIN_PASSWORD overrides
  // per-house generation for convenience in dev.
  const insertAdmin = db.prepare("INSERT INTO house_admins (house, salt, hash, iters) VALUES (?, ?, ?, ?)");
  HOUSES.forEach((house) => {
    const pw = DEMO_ADMIN_PASSWORD || randomPassword();
    const cred = hashPassword(pw);
    insertAdmin.run(house, cred.salt, cred.hash, cred.iters);
    credentials.admins[house] = pw;
  });

  const insertHouse = db.prepare("INSERT INTO house_xp (house, xp) VALUES (?, ?)");
  Object.entries(HOUSE_XP).forEach(([h, xp]) => insertHouse.run(h, xp));

  const insertSociety = db.prepare("INSERT INTO society_xp (society, xp) VALUES (?, ?)");
  Object.entries(SOCIETY_XP).forEach(([s, xp]) => insertSociety.run(s, xp));

  const insertPeer = db.prepare("INSERT INTO peers (id, name, house, level, city, lat, lng, status, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  PEERS.forEach((p) => insertPeer.run(p.id, p.name, p.house, p.level, p.city, p.lat, p.lng, p.status, JSON.stringify(p.skills)));

  const insertEvent = db.prepare(
    `INSERT INTO events (id, title, category, city, venue, lat, lng, date, primary_house, co_host_house, society, xp_reward, status, approvals, rsvps, checked_in)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  EVENTS.forEach((e) =>
    insertEvent.run(
      e.id,
      e.title,
      e.category,
      e.city,
      e.venue,
      e.lat,
      e.lng,
      e.date,
      e.primaryHouse,
      e.coHostHouse,
      e.society,
      e.xpReward,
      e.status,
      JSON.stringify(e.approvals),
      JSON.stringify(e.rsvps),
      JSON.stringify(e.checkedIn)
    )
  );

  const insertAnnouncement = db.prepare("INSERT INTO announcements (id, title, body, audience, pinned, author_house, author, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  ANNOUNCEMENTS.forEach((a) => insertAnnouncement.run(a.id, a.title, a.body, a.audience, a.pinned, a.authorHouse, a.author, a.ts));

  const insertActivity = db.prepare("INSERT INTO activity (id, ts, kind, text, by, house) VALUES (?, ?, ?, ?, ?, ?)");
  ACTIVITY.forEach((a) => insertActivity.run(a.id, a.ts, a.kind, a.text, a.by, a.house));

  // Printed once, on the seed run only. Set DEMO_MEMBER_PASSWORD / DEMO_ADMIN_PASSWORD
  // in .env to use fixed demo credentials instead.
  console.log("\n[seed] Demo credentials (shown once; set DEMO_*_PASSWORD in .env to fix them)");
  console.log(`       member  ${credentials.member.rollNo} : ${credentials.member.password}`);
  HOUSES.forEach((h) => console.log(`       ${h.padEnd(11)} (secretary) : ${credentials.admins[h]}`));
  console.log("");
}
