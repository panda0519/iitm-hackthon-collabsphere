# API

The backend in `backend/` implements every endpoint below. All responses are JSON.
Errors use `{ "error": { "message": string, "code": string } }`.

Base URL: `/api`.

Trust lives on the server. A request carries two optional tokens:

| Header | Meaning |
| --- | --- |
| `Authorization: Bearer <token>` | A member session (from `/auth/login`, `/auth/signup` or `/auth/guest`). |
| `X-Admin-Token: <token>` | A secretary (admin) session, scoped to one house (from `/auth/admin`). |

Tokens are opaque 32-byte random strings with an expiry (12 h member, 4 h admin) and are
re-checked on every request. Nothing is trusted from the body or query string.

## Auth

| Method | Path | Body | Auth | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/signup` | `{ name, rollNo, house, password }` | – | Creates an account (PBKDF2 verifier). Returns `{ token, user }`. |
| `POST` | `/auth/login` | `{ rollNo, password }` | – | Returns `{ token, user }`. Same error for unknown account and wrong password. |
| `POST` | `/auth/guest` | `{ house?, name? }` | – | A throwaway member session for the demo. Not a secretary. |
| `POST` | `/auth/logout` | – | member | Revokes the session. |
| `GET` | `/auth/me` | – | member | The caller's user. |
| `POST` | `/auth/admin` | `{ password }` | member | Verifies the caller's **house** secretary password and returns `{ token, house, expiresAt }`. |
| `DELETE` | `/auth/admin` | – | admin | Revokes the admin token. |

## Authorization matrix

| Route group | Requirement |
| --- | --- |
| `GET /events`, `GET /events/:id`, `GET /ledger`, `GET /ledger/audit`, `GET /leaderboard` | Public |
| `POST /events`, `POST/DELETE /events/:id/rsvp`, `GET /events/:id/code`, `POST /checkins`, `GET /peers`, `POST/DELETE /peers/me`, `POST /peers/:id/ping`, `GET /announcements`, `GET /activity` | Member |
| `PATCH /events/:id`, `POST /events/:id/cancel`, `POST /events/:id/reopen`, `GET /events/:id/attendance`, announcement writes, all `/admin/*`, `GET /ledger/export`, `GET /activity/export` | Admin (secretary) |
| `PATCH /events/:id/approvals/:house` | Admin **and** `:house` must equal the admin token's house |

## Events

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `GET` | `/events` | – | Query: `status`, `house`, `city`, `category`, `q`. Returns live events by default. |
| `GET` | `/events/:id` | – | One event with approvals, RSVPs and check-ins. |
| `POST` | `/events` | `{ title, category, city, venue, lat, lng, dateLocal, coHostHouse, society, xpReward }` | Creates a proposal for the caller's house. Solo events go straight to `APPROVED_LIVE`. |
| `PATCH` | `/events/:id` | partial event fields | Editing the date or venue on a live joint event resets the other house's approval. |
| `PATCH` | `/events/:id/approvals/:house` | `{ approve: boolean, reason?: string }` | The approval state machine (`applyDecision`). |
| `POST` | `/events/:id/cancel` | `{ reason }` | Sets status `CANCELLED`. |
| `POST` | `/events/:id/reopen` | – | Restores `APPROVED_LIVE` / `PENDING_COHOST`. |

## RSVPs

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `POST` | `/events/:id/rsvp` | – | Adds the caller to the RSVP list. |
| `DELETE` | `/events/:id/rsvp` | – | Removes it. |

## Check-ins

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `GET` | `/events/:id/code` | – | `{ code, secondsLeft }`. The host screen reads this. The code rotates every 15 s. |
| `POST` | `/checkins` | `{ eventId, code, lat, lng, photoHash }` | Verifies code + geofence + photo freshness, appends a ledger entry, credits XP to every host house and the backing society. Returns the entry. |
| `GET` | `/events/:id/attendance` | – | `text/csv` of `attendanceRows`. |

## Ledger

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/ledger` | Every entry, newest last. Public. |
| `GET` | `/ledger/audit` | Walks the chain and returns `{ ok, brokenAt }`. Public. |
| `GET` | `/ledger/export` | `text/csv` of `ledgerRows`. Admin only. |

## Leaderboard

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/leaderboard` | `{ houses: [...], societies: [...] }`, houses ranked with `rankHouses`. |

## Announcements

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `GET` | `/announcements` | – | Member. Visible to the caller's house or `All`. |
| `POST` | `/announcements` | `{ title, body, audience, pinned }` | Admin. Author is the caller's house. |
| `PATCH` | `/announcements/:id` | `{ pinned }` | Admin. |
| `DELETE` | `/announcements/:id` | – | Admin. Only the author house. |

## Activity (audit trail)

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/activity` | Member. Query: `kind`, `limit`. |
| `GET` | `/activity/export` | Admin. `text/csv`. |

## Peers

Member only.

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `GET` | `/peers` | – | Query: `city`, `radiusKm`. Returns nearby members who are sharing. |
| `POST` | `/peers/me` | `{ lat, lng, city, status }` | Go live on the map. |
| `DELETE` | `/peers/me` | – | Go offline. |
| `POST` | `/peers/:id/ping` | – | Ping / withdraw a ping. |

## Admin

All routes below require a member session **and** a valid `X-Admin-Token`; `award` and
`bulk-approve` act for the token's house.

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `POST` | `/admin/award` | `{ house, amount, reason }` | Bonus XP, written to the audit trail. |
| `POST` | `/admin/bulk-approve` | `{ ids: string[] }` | Approves many proposals for the caller's house. |
| `GET` | `/admin/export` | – | Full JSON dump of every store. |

## Conventions

- **Approval state machine:** `applyDecision` in `@collabsphere/shared/events`.
- **Hashing:** the ledger `chainHash`/`coreOf` in `@collabsphere/shared/ledger` use
  SHA-256 (the same functions run in the browser and on the server, so a locally built
  chain verifies unchanged server-side). Passwords use PBKDF2-HMAC-SHA256 with a
  per-account random salt (`backend/src/utils/password.js`); the plaintext never leaves
  the request.
- **Check-in codes:** derived from `(eventId, 15-second window, TOTP_SECRET)`. The secret
  is server-only (`backend/src/config`) and is **not** committed; unset, the server mints
  a random one per boot. The browser reads the current code from `GET /events/:id/code`
  rather than deriving it, so the secret never reaches the client.
- **XP:** crediting is idempotent per `(eventId, rollNo)`; a second check-in for the
  same event returns `409`.
- **Time:** the server is the clock for codes and geofence checks; never trust the
  client's timestamp. The client's geofence/photo checks are UX only; the server re-checks
  code, geofence and photo-hash uniqueness.
