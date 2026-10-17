// Integration test for the API's auth, check-in and ledger rules.
//
// It is self-contained: it boots the real Express app on a spare port against an
// in-memory SQLite database, with known seed credentials, and tears nothing down
// because the process exits when the run is over.
//
//   node test/api.test.mjs      (or: npm test --workspace backend)

import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");

const PORT = Number(process.env.TEST_PORT) || 4319;
const MEMBER = { rollNo: "24f200142", password: "test-member-pw" };
const ADMIN_PW = "test-admin-pw";

// Configure the app BEFORE importing it: config/index.js reads the environment at
// module-evaluation time, and server.js calls app.listen() on import.
process.env.PORT = String(PORT);
process.env.DB_PATH = ":memory:";
process.env.DEMO_MEMBER_PASSWORD = MEMBER.password;
process.env.DEMO_ADMIN_PASSWORD = ADMIN_PW;
process.env.TOTP_SECRET = "test-totp-secret";
process.env.SESSION_TTL_H = "1";
process.env.ADMIN_TTL_H = "1";

const BASE = `http://127.0.0.1:${PORT}`;

let pass = 0;
let fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name}${extra ? `  (${extra})` : ""}`);
  }
};
const group = (name) => console.log(`\n${name}`);

async function req(method, path, { token, admin, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (admin) headers["X-Admin-Token"] = admin;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  return { status: res.status, json };
}

// Wait for app.listen() to accept connections.
async function ready() {
  for (let i = 0; i < 100; i += 1) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("API did not start");
}

await import("../src/server.js");
await ready();

// ---------------------------------------------------------------- auth
group("auth");
ok("GET /api/peers without a token is 401", (await req("GET", "/api/peers")).status === 401);
ok("an empty bearer token is rejected", (await req("GET", "/api/peers", { token: "" })).status === 401);
ok("a forged bearer token is rejected", (await req("GET", "/api/peers", { token: "not-a-real-token" })).status === 401);
ok(
  "login with the wrong password is 401",
  (await req("POST", "/api/auth/login", { body: { rollNo: MEMBER.rollNo, password: "nope" } })).status === 401
);
ok(
  "login for an unknown account is 401",
  (await req("POST", "/api/auth/login", { body: { rollNo: "24f999999", password: MEMBER.password } })).status === 401
);

const login = await req("POST", "/api/auth/login", { body: MEMBER });
ok("login with the seeded password succeeds", login.status === 200 && !!login.json.token, JSON.stringify(login.json));
const token = login.json?.token;
ok("login returns the member without the password", login.json?.user?.rollNo === MEMBER.rollNo && login.json.user.password === undefined);
ok("the stored password is not a plaintext column", typeof login.json?.user?.house === "string");

const me = await req("GET", "/api/auth/me", { token });
ok("GET /api/auth/me returns the same member", me.status === 200 && me.json.rollNo === MEMBER.rollNo);

// ---------------------------------------------------------------- admin / secretary scoping
group("admin");
ok(
  "admin unlock with the wrong password is 401",
  (await req("POST", "/api/auth/admin", { token, body: { password: "wrong" } })).status === 401
);
ok("admin unlock without a session is 401", (await req("POST", "/api/auth/admin", { body: { password: ADMIN_PW } })).status === 401);

const adminRes = await req("POST", "/api/auth/admin", { token, body: { password: ADMIN_PW } });
ok("admin unlock with the house secret succeeds", adminRes.status === 200 && !!adminRes.json.token, JSON.stringify(adminRes.json));
ok("the admin token is scoped to the member's house", adminRes.json?.house === login.json.user.house);
const admin = adminRes.json?.token;

ok("award without an admin token is 401", (await req("POST", "/api/admin/award", { token, body: { house: "Gir", amount: 5, reason: "x" } })).status === 401);

const guest = await req("POST", "/api/auth/guest", { body: { house: "Gir", name: "Gir Tester" } });
ok("a guest session is issued", guest.status === 200 && !!guest.json.token);
ok(
  "a guest has no secretary powers (award is 401)",
  (await req("POST", "/api/admin/award", { token: guest.json.token, body: { house: "Gir", amount: 5, reason: "x" } })).status === 401
);

// ---------------------------------------------------------------- check-in
group("check-in");
const live = (await req("GET", "/api/events")).json;
const ev = Array.isArray(live)
  ? live.find((e) => e.status === "APPROVED_LIVE" && (e.primaryHouse === "Bandipur" || e.coHostHouse === "Bandipur"))
  : null;
ok("found a live event for the member's house", !!ev, JSON.stringify(live).slice(0, 120));

await req("POST", `/api/events/${ev.id}/rsvp`, { token });
const codeRes = await req("GET", `/api/events/${ev.id}/code`, { token });
ok("the event code is served to a signed-in member", codeRes.status === 200 && /^\d{6}$/.test(codeRes.json.code), JSON.stringify(codeRes.json));
ok(
  "the event code is not served to an anonymous caller",
  (await req("GET", `/api/events/${ev.id}/code`)).status === 401
);

const badCode = await req("POST", "/api/checkins", {
  token,
  body: { eventId: ev.id, code: "000000", lat: ev.lat, lng: ev.lng, photoHash: "sha256:" + "a".repeat(64) }
});
ok("check-in with a wrong code is 400", badCode.status === 400, `got ${badCode.status}`);

const farAway = await req("POST", "/api/checkins", {
  token,
  body: { eventId: ev.id, code: codeRes.json.code, lat: ev.lat + 1, lng: ev.lng, photoHash: "sha256:" + "b".repeat(64) }
});
ok("check-in outside the geofence is 400", farAway.status === 400, `got ${farAway.status}`);

const good = await req("POST", "/api/checkins", {
  token,
  body: { eventId: ev.id, code: codeRes.json.code, lat: ev.lat, lng: ev.lng, photoHash: "sha256:" + "c".repeat(64) }
});
ok("check-in in range with a good code succeeds", good.status === 201 && !!good.json.entry, JSON.stringify(good.json).slice(0, 200));
ok("the ledger entry is a SHA-256 chain value", /^sha256:[0-9a-f]{64}$/.test(good.json?.entry?.hash || ""), good.json?.entry?.hash);
ok("the ledger entry links to the previous hash", (good.json?.entry?.prevHash || "").startsWith("sha256:") || good.json?.entry?.prevHash === "GENESIS");

const reuse = await req("POST", "/api/checkins", {
  token,
  body: { eventId: ev.id, code: codeRes.json.code, lat: ev.lat, lng: ev.lng, photoHash: "sha256:" + "d".repeat(64) }
});
ok("a second check-in for the same event is 409", reuse.status === 409, `got ${reuse.status}`);

const audit = await req("GET", "/api/ledger/audit");
ok("the ledger audit passes after a check-in", audit.json?.ok === true, JSON.stringify(audit.json));

// ---------------------------------------------------------------- approvals
group("approvals");
const all = (await req("GET", "/api/events?status=all")).json;
const pending = Array.isArray(all)
  ? all.find((e) => e.status === "PENDING_COHOST" && e.approvals && e.approvals[login.json.user.house] === false)
  : null;
if (pending) {
  const other = Object.keys(pending.approvals).find((h) => h !== login.json.user.house);
  const wrongHouse = await req("PATCH", `/api/events/${pending.id}/approvals/${other}`, { token, admin, body: { approve: true } });
  ok("approving for another house is 403", wrongHouse.status === 403, `got ${wrongHouse.status}`);
  const rightHouse = await req("PATCH", `/api/events/${pending.id}/approvals/${login.json.user.house}`, {
    token,
    admin,
    body: { approve: true }
  });
  ok("approving for your own house succeeds", rightHouse.status === 200, `got ${rightHouse.status}`);
  const noAdmin = await req("PATCH", `/api/events/${pending.id}/approvals/${login.json.user.house}`, { token, body: { approve: true } });
  ok("approving without an admin token is 401", noAdmin.status === 401, `got ${noAdmin.status}`);
} else {
  ok("a pending co-host approval exists to test", false, "no PENDING_COHOST event with a rejection for this house");
}

// ---------------------------------------------------------------- session lifecycle
group("session lifecycle");
const guestLogout = await req("POST", "/api/auth/logout", { token: guest.json.token });
ok("logout succeeds", guestLogout.status === 200 || guestLogout.status === 204, `got ${guestLogout.status}`);
ok("a revoked token is rejected", (await req("GET", "/api/auth/me", { token: guest.json.token })).status === 401);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
