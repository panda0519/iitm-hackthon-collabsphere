# Refactor notes

What changed while splitting the single-file prototype, what to watch out for, and
what is deliberately still a prototype.

## Deviations from the original

- **One select in the original was missing it.** `DiscoverTab` rendered only the
  sort `<select>`; the host-house `<select>` (and its `houseFilter` state) had been
  dropped from the markup. Both are restored here and `houseFilter` is wired to the
  `visibleEvents` filter that already referenced it.
- **Assets extracted.** The two inline base64 blobs (hero artwork + its timing map)
  moved to `frontend/public/assets/hero-collab.webp` and
  `hero-collab-timing.png`. The hero writer now loads them by URL instead of a
  data URL, which keeps the JS readable and lets the browser cache them.
- **CDN vs bundle.** React and Tailwind are now bundled (Vite + PostCSS). Leaflet,
  three.js and `qrcode-generator` are still loaded from CDNs, because the intro
  overlay and the backdrop use their globals (`L`, `THREE`, `qrcode`) directly.
  Moving them into the bundle is a follow-up (see below).
- **`React.Fragment` → `Fragment`, `ReactDOM.createPortal` → `createPortal`.**
  JSX now uses the automatic runtime, so `React` is only imported where a hook is
  needed.

## Security pass (hardening the prototype's browser-only rules)

The prototype's rules all ran in the browser, where DevTools can rewrite them. The
same UX is kept, but the trust was moved to the server. See `README.md` and
`docs/API.md` for the operational side.

### Fixed

- **Admin lock is no longer client-side.** The unlock now posts the password to
  `POST /auth/admin`, which verifies a per-house PBKDF2 verifier and returns an
  opaque, expiring admin token. `sessionStorage` flags grant nothing.
- **No password in the page source.** `DEMO_ADMIN_HINT` is empty, so the lock screen
  no longer prints `Demo@2026`, and no hash is embedded for the server path.
- **One password per house.** House secretaries have their own credential; approving
  for `:house` requires an admin token for that house (403 otherwise).
- **Salted password storage.** Accounts store `PBKDF2-HMAC-SHA256`, 210k iterations,
  per-account random salt. The old fast SHA-256 (`"cs|" + password`) and the 32-bit
  fallback are gone; offline mode fails closed when WebCrypto is unavailable.
- **Login can no longer be skipped.** `cs_session` holds an opaque server token that
  is validated on every request; a forged value yields `401`.
- **The ledger is a real chain.** `chainHash` is now SHA-256 (was two 32-bit FNV-1a
  hashes), so a forged chain cannot be produced by hand.
- **Photo fingerprints hash the image.** `photoFingerprint` hashes the file bytes
  with SHA-256 (was `name|size|lastModified`), so renaming a file no longer reuses a
  photo. Files over 6 MB are rejected before hashing.
- **The check-in secret is server-side.** `TOTP_SECRET` has no committed default; the
  server uses `.env` or mints a random per-boot value. The host screen fetches the
  current code from `GET /events/:id/code`, and the server re-verifies code, geofence
  and photo uniqueness.
- **CSP + referrer policy.** The production build injects a
  `Content-Security-Policy` (inline scripts allow-listed by hash, no `unsafe-inline`
  for scripts) and a `strict-origin-when-cross-origin` referrer policy. Dev stays
  open so HMR works.

### Still demo-only

- **Approval, RSVP and award writes are server-side, but discovery data is broad.** In
  server mode all reads come from the API; there is no per-member row-level privacy
  beyond the house scoping that already existed.
- **The tamper demo is cosmetic in server mode.** `Tamper test` edits this browser's
  copy of the chain to show detection; the server chain is untouched (press `Audit
  chain` to re-sync).
- **SRI is not set on the CDN scripts.** Hashes must come from srihash.org; a wrong
  `integrity` breaks the app, so it is left as a follow-up.
- **Credentials live in a gitignored `.env`** (or printed once by the seeder), not in
  source. That is the intent, but it is still a shared demo secret, not per-user SSO.
- **`localStorage` writes are unguarded against quota.** Strings-only JSON, wrapped
  in `try/catch`, so a full store silently fails to persist. Acceptable for a demo.
- **CSV export** neutralises formula-injection cells (`= + - @`, tab, CR) — kept
  exactly as before, since it is correct.

## Structural choices worth knowing

- `shared/` is ESM with a subpath export map, so the backend can import
  `@collabsphere/shared/ledger` without pulling in the rest.
- The UI talks to the API through `frontend/src/services/client.js`, selected by
  `VITE_USE_API`. Without it, `services/storage.js` (localStorage) is the adapter.
- `state/actions.js` holds the offline implementations; `state/apiActions.js` holds the
  server-backed ones with the same signatures, and `AppContext` merges them by mode.
- The React code that split across files kept the original comments (they explain
  *why*, not *what*), only re-indented to the module boundary.
- Reduced-motion handling is unchanged and duplicated on purpose: a CSS pass and a
  JS `prefersReducedMotion()` guard, because the animations are driven from both.

## Follow-ups

1. Bundle Leaflet / three / qrcode instead of CDN `<script>` tags, and drop the
   `window.L` / `window.THREE` globals from the two legacy scripts (then add SRI or
   self-host, and tighten `script-src`).
2. Add per-member data privacy (peers/RSVPs visible only to the relevant houses).
3. Extend the API test (`npm test`) to the CSRF/rate-limiting and ledger-export paths,
   and add unit tests for `shared/` (the rules are pure, so this is cheap and
   high-value): approval transitions, ledger audit with a tampered entry and TOTP grace.

The `401/403/409` matrix in `docs/API.md` is covered by `backend/test/api.test.mjs`.

## Dependency audit

`npm audit --omit=dev` is clean. `npm audit` reports 9 advisories (3 moderate, 6 high)
that are all in the **dev/build toolchain** (`vite`/`esbuild`, `tailwind`/`postcss`,
`micromatch`); the production dependency tree (`express`, `cors`) has none. The
suggested fix bumps to `vite@8` / `tailwind@4` (breaking), so it is left for a
separate upgrade rather than mixed into the security pass.
