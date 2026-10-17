// Domain constants shared by the frontend and the backend.
// Nothing in this module touches the DOM or React, so it is safe to import anywhere.

// ---- check-in rules ----
export const GEOFENCE_M = 150; // max distance from the venue to check in, in metres
export const TOTP_STEP = 15; // the check-in code rotates every 15 seconds

// ---- local storage prefix (frontend prototype mode) ----
export const STORE = "collabsphere_v3_";

// ---- admin console password ----
// Only a SHA-256 fingerprint of the password is stored, never the password itself.
// This is a browser-side lock for the offline demo only. The real lock is the
// server's per-house credential check (backend/src/services/auth.js); when the app
// runs against the API this constant is never consulted.
// To change it, run `node -e "import('@collabsphere/shared/hash').then(m=>console.log(m.sha256Hex('collabsphere-admin-v1:'+'your new password')))"`
// and paste the result into ADMIN_HASH. Keep ADMIN_SALT as it is.
export const ADMIN_SALT = "collabsphere-admin-v1";
export const ADMIN_HASH = "33506a89dcbab378152e686b1c1f609980978c15cbcde67ea783394b12161f3d";
export const DEMO_ADMIN_HINT = "Demo@2026"; // shown on the lock screen for examiner/demo access
export const ADMIN_MAX_TRIES = 5; // wrong guesses allowed before a cool-down
export const ADMIN_COOLDOWN_S = 30; // cool-down length, in seconds
export const ADMIN_SESSION_KEY = "collabsphere_v3_admin_ok"; // LEGACY local flag; server mode uses a signed token
export const ADMIN_TOKEN_KEY = "collabsphere_v3_admin_token"; // sessionStorage: opaque server-issued admin token

// ---- accounts + sessions (server mode) ----
export const SESSION_TOKEN_KEY = "cs_session"; // sessionStorage: opaque server-issued session token
export const PBKDF2_ITERATIONS = 210000; // used by the offline fallback and mirrored by the server
export const MAX_PHOTO_BYTES = 6 * 1024 * 1024; // reject photos larger than this before hashing

// ---- map tiles ----
// Map tiles that need no API key. CARTO now stamps "API KEY REQUIRED" across every
// keyless tile, so the map uses Esri's gray canvas (base + a label layer). If Esri
// cannot be reached it falls back to OpenStreetMap's own tiles, which get a CSS tint
// in the dark theme.
export const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
export const OSM_TILE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_SOURCES = [
  {
    id: "esri",
    maxNativeZoom: 16,
    tint: false,
    attribution: "Tiles &copy; Esri, HERE, Garmin, OpenStreetMap contributors",
    layers: {
      dark: [
        ESRI + "World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        ESRI + "World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
      ],
      light: [
        ESRI + "World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        ESRI + "World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
      ]
    }
  },
  {
    id: "osm",
    maxNativeZoom: 19,
    tint: true,
    attribution: "&copy; OpenStreetMap contributors",
    layers: { dark: [OSM_TILE], light: [OSM_TILE] }
  }
];

// ---- houses, societies and event types (Build-a-Thon 1.0) ----
export const HOUSES = [
  "Saranda",
  "Gir",
  "Kanha",
  "Bandipur",
  "Corbett",
  "Namdapha",
  "Pichavaram",
  "Wayanad",
  "Kaziranga"
];

export const SOCIETIES = [
  "None",
  "Code Crafters",
  "Paradox Tech Society",
  "boundless AI Club",
  "Sahitya Literary Guild",
  "Raaga Music Society"
];

export const CATEGORIES = ["Co-Working", "Joint Meetup", "Regional Meetup"];

// Each house has its own colour. Colour is always paired with the house name,
// never used as the only signal.
export const HOUSE_COLORS = {
  Saranda: "#22c7a9",
  Gir: "#f2c14e",
  Kanha: "#8a7dff",
  Bandipur: "#ff6b4a",
  Corbett: "#e05fd0",
  Namdapha: "#38bdf8",
  Pichavaram: "#7ddc5a",
  Wayanad: "#4d8dff",
  Kaziranga: "#ee4b6a"
};

export const houseColor = (h) => HOUSE_COLORS[h] || "#9ca2d0";

// A single solid colour, or a two-house split for joint events.
export const houseSplit = (hs, shape) => {
  if (hs.length < 2) return houseColor(hs[0]);
  const a = houseColor(hs[0]);
  const b = houseColor(hs[1]);
  return shape === "conic"
    ? `conic-gradient(${a} 0 50%, ${b} 50% 100%)`
    : `linear-gradient(to bottom, ${a} 0 50%, ${b} 50% 100%)`;
};

export const CITIES = {
  Kanpur: { lat: 26.4499, lng: 80.3319, zoom: 12 },
  Bengaluru: { lat: 12.9716, lng: 77.5946, zoom: 12 },
  Chennai: { lat: 13.0067, lng: 80.2206, zoom: 12 },
  Delhi: { lat: 28.6139, lng: 77.209, zoom: 12 }
};

// ---- levels (earned from verified check-ins) ----
export const LEVELS = [
  { min: 0, name: "Newcomer" },
  { min: 100, name: "Explorer" },
  { min: 250, name: "Trailblazer" },
  { min: 500, name: "Pathfinder" },
  { min: 1000, name: "Ranger" }
];
