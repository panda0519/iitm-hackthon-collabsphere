// Demo seed data. Dates are relative to today so the demo never looks stale.

import { inDays, agoISO } from "@collabsphere/shared";

export const INITIAL_USER = { rollNo: "24f200142", name: "乛卩ムNDム", house: "Bandipur", xp: 210 };

export const INITIAL_HOUSE_XP = {
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

export const INITIAL_SOCIETY_XP = {
  "Code Crafters": 360,
  "Paradox Tech Society": 320,
  "boundless AI Club": 280,
  "Sahitya Literary Guild": 150,
  "Raaga Music Society": 190
};

export const INITIAL_PEERS = [
  {
    id: "p1",
    name: "Aarav Verma",
    house: "Bandipur",
    level: "Diploma",
    city: "Kanpur",
    lat: 26.461,
    lng: 80.345,
    status: "Down for DSA & C++ Co-working",
    skills: ["C++", "PyTorch"]
  },
  {
    id: "p2",
    name: "Sneha Nair",
    house: "Namdapha",
    level: "Degree",
    city: "Kanpur",
    lat: 26.438,
    lng: 80.319,
    status: "Studying ML Foundations @ Cafe",
    skills: ["ML", "Python"]
  },
  {
    id: "p3",
    name: "Rohan Iyer",
    house: "Kanha",
    level: "Diploma",
    city: "Bengaluru",
    lat: 12.978,
    lng: 77.605,
    status: "Building Hackathon Prototype",
    skills: ["Next.js", "FastAPI"]
  },
  {
    id: "p4",
    name: "Divya Krishnan",
    house: "Corbett",
    level: "Degree",
    city: "Chennai",
    lat: 12.9915,
    lng: 80.2337,
    status: "At IITM Research Park Library",
    skills: ["Data Science", "SQL"]
  },
  {
    id: "p5",
    name: "Kabir Sharma",
    house: "Kaziranga",
    level: "Foundation",
    city: "Delhi",
    lat: 28.628,
    lng: 77.219,
    status: "Weekend Mock Viva Prep",
    skills: ["Python", "Stats"]
  },
  {
    id: "p6",
    name: "Meera Pillai",
    house: "Pichavaram",
    level: "Degree",
    city: "Chennai",
    lat: 13.01,
    lng: 80.23,
    status: "Design sprint co-working",
    skills: ["UI/UX", "Figma"]
  },
  {
    id: "p7",
    name: "Arjun Rao",
    house: "Saranda",
    level: "Diploma",
    city: "Kanpur",
    lat: 26.456,
    lng: 80.355,
    status: "DevOps lab @ Civil Lines",
    skills: ["Go", "Docker"]
  }
];

export const INITIAL_EVENTS = [
  {
    id: "EVT-101",
    title: "Kanpur Algorithm & System Design Jam",
    category: "Co-Working",
    city: "Kanpur",
    venue: "Swaroop Nagar Co-Work Hub, Kanpur",
    lat: 26.472,
    lng: 80.322,
    date: inDays(4, 16, 0),
    primaryHouse: "Bandipur",
    coHostHouse: "Saranda",
    society: "Code Crafters",
    xpReward: 50,
    approvals: { Bandipur: true, Saranda: true },
    status: "APPROVED_LIVE",
    rsvps: ["24f200142", "23f100891", "24f300112"],
    checkedIn: ["23f100891"]
  },
  {
    id: "EVT-102",
    title: "Cross-House Deep Learning Paper Reading",
    category: "Joint Meetup",
    city: "Kanpur",
    venue: "Kakadeo Study Lounge, Kanpur",
    lat: 26.4685,
    lng: 80.2995,
    date: inDays(7, 17, 30),
    primaryHouse: "Bandipur",
    coHostHouse: "Kanha",
    society: "boundless AI Club",
    xpReward: 75,
    approvals: { Bandipur: true, Kanha: false },
    status: "PENDING_COHOST",
    rsvps: ["24f200142"],
    checkedIn: []
  },
  {
    id: "EVT-103",
    title: "Bengaluru Indiranagar Sunday Code & Coffee",
    category: "Co-Working",
    city: "Bengaluru",
    venue: "Third Wave Coffee, Indiranagar",
    lat: 12.9784,
    lng: 77.6408,
    date: inDays(5, 11, 0),
    primaryHouse: "Namdapha",
    coHostHouse: "Corbett",
    society: "None",
    xpReward: 40,
    approvals: { Namdapha: true, Corbett: true },
    status: "APPROVED_LIVE",
    rsvps: ["22f300410", "23f200511"],
    checkedIn: []
  },
  {
    id: "EVT-104",
    title: "Chennai Guindy Pre-Paradox Mixer",
    category: "Regional Meetup",
    city: "Chennai",
    venue: "IITM Research Park Food Court",
    lat: 12.9902,
    lng: 80.2419,
    date: inDays(11, 15, 0),
    primaryHouse: "Corbett",
    coHostHouse: "Bandipur",
    society: "Raaga Music Society",
    xpReward: 60,
    approvals: { Corbett: true, Bandipur: true },
    status: "APPROVED_LIVE",
    rsvps: ["23f100222"],
    checkedIn: []
  },
  {
    id: "EVT-105",
    title: "Delhi Weekend Hackathon Buddy-Up",
    category: "Joint Meetup",
    city: "Delhi",
    venue: "Connaught Place Co-Work Studio, Delhi",
    lat: 28.6315,
    lng: 77.2167,
    date: inDays(9, 10, 30),
    primaryHouse: "Kaziranga",
    coHostHouse: "Bandipur",
    society: "Code Crafters",
    xpReward: 80,
    approvals: { Kaziranga: true, Bandipur: false },
    status: "PENDING_COHOST",
    rsvps: [],
    checkedIn: []
  },
  {
    id: "EVT-106",
    title: "Chennai Adyar Study Sprint",
    category: "Co-Working",
    city: "Chennai",
    venue: "Adyar Community Library, Chennai",
    lat: 13.0067,
    lng: 80.2575,
    date: inDays(2, 10, 0),
    primaryHouse: "Wayanad",
    coHostHouse: "Pichavaram",
    society: "boundless AI Club",
    xpReward: 45,
    approvals: { Wayanad: true, Pichavaram: true },
    status: "APPROVED_LIVE",
    rsvps: ["23f100333"],
    checkedIn: []
  },
  {
    id: "EVT-107",
    title: "Kanpur Quiet Hours Co-Working",
    category: "Co-Working",
    city: "Kanpur",
    venue: "Civil Lines Reading Room, Kanpur",
    lat: 26.473,
    lng: 80.35,
    date: inDays(1, 18, 0),
    primaryHouse: "Saranda",
    coHostHouse: "",
    society: "None",
    xpReward: 30,
    approvals: { Saranda: true },
    status: "APPROVED_LIVE",
    rsvps: [],
    checkedIn: []
  }
];

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: "an1",
    title: "Welcome to CollabSphere",
    body: "Propose a joint event with another house, get it approved, then check in on the day with a live code to earn XP for both houses.",
    audience: "All",
    pinned: true,
    authorHouse: "Bandipur",
    author: "Bandipur Secy",
    ts: agoISO(26)
  },
  {
    id: "an2",
    title: "Bandipur: RSVP early",
    body: "Regional meetups fill up fast. RSVP in the Discover tab so your seat is counted.",
    audience: "Bandipur",
    pinned: false,
    authorHouse: "Bandipur",
    author: "Bandipur Secy",
    ts: agoISO(52)
  },
  {
    id: "an3",
    title: "Gir: planning call this week",
    body: "Gir secretaries are collecting joint-event ideas. Send yours to your secretary before the call.",
    audience: "Gir",
    pinned: false,
    authorHouse: "Gir",
    author: "Gir Secy",
    ts: agoISO(70)
  }
];

export const INITIAL_ACTIVITY = [
  {
    id: "ac1",
    ts: agoISO(3),
    kind: "approval",
    text: "Namdapha and Corbett's Bengaluru Code & Coffee went live",
    by: "Corbett Secy",
    house: "Corbett"
  },
  {
    id: "ac2",
    ts: agoISO(20),
    kind: "event",
    text: "Kaziranga proposed “Delhi Weekend Hackathon Buddy-Up” with Bandipur",
    by: "Kaziranga Secy",
    house: "Kaziranga"
  },
  {
    id: "ac3",
    ts: agoISO(45),
    kind: "approval",
    text: "Saranda and Bandipur's Kanpur Algorithm Jam went live",
    by: "Saranda Secy",
    house: "Saranda"
  },
  {
    id: "ac4",
    ts: agoISO(60),
    kind: "checkin",
    text: "A member checked in to the Kanpur Algorithm Jam (+50 XP)",
    by: "Member",
    house: "Saranda"
  }
];
