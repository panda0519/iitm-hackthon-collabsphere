# CollabSphere

**IITM BS cross-house & regional meetup engine.** Find cross-house and regional
meetups on a live map, check in at the venue with a rotating code + geofence +
photo, and watch each house climb a tamper-evident ledger.

This repository is a refactor of a single, self-contained `iitm-hackthon.html`
prototype into an npm-workspaces monorepo with a real frontend build, a shared
domain layer, and a backend skeleton that mirrors the same rules.

## Layout

```
collabsphere/
├─ shared/    Pure domain logic (no React, no DOM) used by both sides
├─ frontend/  Vite + React 18 + Tailwind (build-time)
├─ backend/   Node 22 + Express + SQLite (node:sqlite), with real auth
├─ docs/      Architecture, API and refactor notes
└─ legacy/    The original single-file prototype, kept for reference
```

See `docs/ARCHITECTURE.md` for how the pieces fit together and
`docs/REFACTOR_NOTES.md` for what changed and what is still a prototype.

## Getting started

Requirements: **Node 22.5+** (the backend uses the built-in `node:sqlite` driver).

```bash
npm install                 # installs all three workspaces
cp .env.example .env        # backend config (optional; sane defaults without it)
cp frontend/.env.example frontend/.env   # run the UI against the API

npm run dev                 # frontend at http://localhost:5173
npm run dev:api             # backend at http://localhost:4000
```

The `frontend/.env` sets `VITE_USE_API=1`, which points the UI at the API through the
Vite dev proxy (`/api` → `http://localhost:4000`). Run **`npm run dev:offline`** to load
`frontend/.env.offline` instead, which flips `VITE_USE_API=0` and falls back to the
offline `localStorage` prototype (no server needed).

### Demo credentials

Accounts and secretary passwords live on the server, never in the bundle. Set
`DEMO_MEMBER_PASSWORD` / `DEMO_ADMIN_PASSWORD` in `.env`, or let the server generate
strong random passwords on first seed — it prints them **once** to its console:

```
[seed] Demo credentials (shown once; set DEMO_*_PASSWORD in .env to fix them)
       member  24f200142 : <generated>
       Bandipur (secretary) : <generated>   ... one per house
```

- **Sign in:** the seeded roll number (`24f200142`) with the member password, or use
  **Sign up**. The intro also offers **Continue as guest**, a scoped session with no
  secretary powers.
- **Admin tab:** enter **your house's** secretary password (per-house, from the console
  or `DEMO_ADMIN_PASSWORD`). The lock screen no longer prints it.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server for the frontend |
| `npm run dev:offline` | Same, but in offline (localStorage) mode — no API needed |
| `npm run dev:api` | Express backend with `node --watch` |
| `npm run build` | Production build of the frontend (injects the CSP) |
| `npm run preview` | Serve the built frontend (proxies `/api` too, so the CSP build is testable) |
| `npm start` | Run the backend |
| `npm test` | Boot the API against an in-memory DB and run the auth/check-in/ledger suite |

## Security model

The prototype's rules all ran in the browser, where anyone can open DevTools. The
refactor keeps the same UX but moves the trust to the server:

- **Auth** — PBKDF2-HMAC-SHA256 verifiers (per-account salt), opaque session/admin
  tokens with an expiry, re-checked on every request. `sessionStorage` flags no longer
  grant anything.
- **Secretary scoping** — one password per house; approval of `:house` requires an
  admin token for that same house.
- **Check-in** — the rotating code secret is server-side only (the host screen fetches
  the current code); the code, geofence and photo-hash uniqueness are re-verified by
  the server.
- **Ledger** — a SHA-256 hash chain (was a 32-bit rolling hash), appended server-side.
- **Browser** — a Content-Security-Policy and a strict referrer policy are injected into
  the production build only, so dev HMR is unaffected.

See `docs/REFACTOR_NOTES.md` for the full list and what remains demo-only.

## Notes

- The intro overlay (3D globe + login) and the animated backdrop still load
  Leaflet / three.js / `qrcode-generator` from CDNs, exactly as before, so their
  behaviour is unchanged. React and Tailwind are now bundled.
- The hero artwork and its timing map were extracted from the original inline
  base64 blobs into `frontend/public/assets/`.
