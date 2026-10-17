# Architecture

## The shape of the system

```
                     shared/  (pure JS: geo, hash, totp, ledger, dates, events, leaderboard, csv)
                        ▲                         ▲
                        │                         │
             frontend/  │                         │  backend/
        Vite + React 18 │                         │  Express + SQLite
        Tailwind (build)│                         │  node --watch
                        │                         │
        services/client │   REST /api (Bearer /  │  sessions, PBKDF2,
          .js  ─────────┼── X-Admin-Token) ──────┤  TOTP secret, ledger
                        │                         │
          or (offline   │                         │
          fallback)     │                         │
          localStorage  │                         │
```

`shared/` is the source of truth for every rule both sides must agree on. It has
**no React and no DOM**, so the exact same `totpFor`, `chainHash`, `applyDecision`
and `rankHouses` run in the browser and on the server.

The frontend has **two adapters** behind one seam (`frontend/src/services/`):

| Mode | Selected by | Writes | Trust |
| --- | --- | --- | --- |
| **Server** (default in dev here) | `VITE_USE_API=1` in `frontend/.env` | `services/client.js` → `/api` | The server. Tokens are opaque and re-checked every request. |
| **Offline** | no `VITE_USE_API` | `services/storage.js` → `localStorage` | The browser. Fine for a UI demo; not access control. |

Both modes expose the **same action signatures** (`state/actions.js` for offline,
`state/apiActions.js` for the server), and `AppContext` merges them by mode, so no
component knows which one is active. The in-browser Babel + Tailwind Play CDN and the
`window.csAdminHash` globals from the original are gone.

## Why the split looks like this

The original prototype put everything in one `<script type="text/babel">`. That is
great for a hackathon and painful to grow. The refactor keeps the same numbered
sections from the original file and maps them, one by one, onto files:

| Original section | Where it lives now |
| --- | --- |
| 1. Core helpers | `shared/src/{geo,hash,totp,ledger,dates}.js`, `frontend/src/services/{clipboard,calendar,download}.js`, `frontend/src/utils/` |
| 2. Seed data | constants → `shared/src/constants.js`; demo data → `frontend/src/data/seed.js`, `backend/src/db/seed.js` |
| 3. Hooks | `frontend/src/hooks/` |
| 3b. Pure services | `shared/src/{events,leaderboard,csv}.js` |
| 4. UI primitives | `frontend/src/components/ui/` |
| 5. Leaflet map | `frontend/src/components/map/RegionalLeafletMap.jsx` |
| 6. Event + peer cards | `frontend/src/components/cards/` |
| 7. Discover | `frontend/src/features/discover/` |
| 8. Host manager | `frontend/src/features/host/` |
| 9. Check-in | `frontend/src/features/checkin/` |
| 10. Ledger | `frontend/src/features/leaderboard/` |
| 10b. Dashboard | `frontend/src/features/dashboard/` |
| 10c. Admin | `frontend/src/features/admin/` |
| 11. App shell | `frontend/src/components/layout/` |
| 12. App state + actions | `frontend/src/state/` and `frontend/src/App.jsx` |

## Frontend layers

```
components/ui        presentational primitives (Icon, Btn, Card, Modal, ...)
components/cards     EventCard, PeerCard, SelectedEventCard, SelectedPeerCard
components/map       RegionalLeafletMap (imperative Leaflet wrapper)
components/layout    Rail, BottomNav, TopBar, CommandPalette, TourCard
features/*           one folder per tab
state/               AppProvider (data) + actions (behaviour)
services/            the ONLY layer that knows where data comes from
hooks/               small reusable React hooks
data/                seed data for the demo
```

**`services/` is the seam.** `client.js` speaks to the API (and holds the token
helpers); `storage.js` reads and writes `localStorage` for offline mode. Swapping the
two is a change in one folder, not in every component.

## State and actions

`state/AppContext.jsx` owns every piece of state (`user`, `events`, `peers`,
`ledger`, `announcements`, `activity`, XP tables, theme, …) and exposes it through
`useApp()`. In server mode it also owns `refresh()`, which pulls the authoritative
state from the API on mount and after each mutation, so a client that forged
`localStorage` still cannot forge what the UI displays.

`state/actions.js` turns that state plus a few setters into the behaviour the UI calls
(`handleToggleRsvp`, `handleProposeEvent`, `handleDecide`, `handleClaimCheckIn`, the
admin actions and the exports). `state/apiActions.js` implements the same names against
the API; `AppContext` spreads the API versions over the offline ones when
`apiEnabled()` is true. `App.jsx` is layout and routing only.

## Backend

`backend/` implements the same rules and is the source of truth in server mode:

```
src/server.js        Express bootstrap (JSON body, error handler)
src/routes/*         one file per resource
src/services/*       approval state machine, check-in verification, XP, ledger append,
                     auth (signup/login/guest/sessions/admin unlock)
src/db/*             node:sqlite connection, schema.sql, seed.js
src/middleware/*     validate, errorHandler, auth (attachUser/requireUser/requireAdmin/requireOwnHouse)
src/config/*         env-driven config (ports, TOTP secret, seed passwords)
```

The routes are intentionally thin: they validate input and delegate to
`src/services`, which imports the same `@collabsphere/shared` functions the
frontend uses.

## Auth and trust

- **Accounts** are PBKDF2-HMAC-SHA256 verifiers (210k iterations, per-account random
  salt) compared with `timingSafeEqual`. The plaintext is never stored.
- **Sessions** are opaque 32-byte random bearer tokens with an expiry, held in
  `sessionStorage` (`cs_session`). A forged value is rejected with `401`.
- **Secretary (admin)** access is a second, separate token scoped to a single house,
  obtained from `POST /auth/admin` and sent as `X-Admin-Token`. Approving for a house
  you do not hold a token for is `403`.
- **Check-in** codes come from a server-only `TOTP_SECRET`; the host screen reads the
  current code from `GET /events/:id/code`. The server re-verifies the code, the
  geofence and photo-hash uniqueness.
- **Ledger** entries are appended server-side and chained with SHA-256.

## What still runs client-side on purpose

- **Offline mode** keeps the original browser-only behaviour (including a
  `sessionStorage` admin flag) so the app can be demoed with no server. It is not
  access control and is labelled as such in the UI.
- **The tamper demo** edits the browser's copy of the ledger to show detection; the
  server chain is untouched (press `Audit chain` to re-sync).
- **Geofence and photo checks** in the browser are UX only — the server re-checks both.
