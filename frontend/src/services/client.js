// Unified backend client. When VITE_USE_API=1 the app talks to the Express API and
// all trust (sessions, secretary unlock, check-in verification, ledger) lives on the
// server. Otherwise the caller falls back to the offline localStorage prototype.
//
// Tokens are opaque random strings issued by the server; the browser cannot forge a
// valid one. They live in sessionStorage so closing the tab ends the session.

import { SESSION_TOKEN_KEY, ADMIN_TOKEN_KEY } from "@collabsphere/shared";

const USE_API = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_USE_API === "1";
const BASE = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || "";

export const apiEnabled = () => !!USE_API && typeof fetch === "function";

export const getToken = () => {
  try { return sessionStorage.getItem(SESSION_TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? sessionStorage.setItem(SESSION_TOKEN_KEY, t) : sessionStorage.removeItem(SESSION_TOKEN_KEY); } catch {}
};
export const getAdminToken = () => {
  try { return sessionStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
};
export const setAdminToken = (t) => {
  try { t ? sessionStorage.setItem(ADMIN_TOKEN_KEY, t) : sessionStorage.removeItem(ADMIN_TOKEN_KEY); } catch {}
};

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  const admin = getAdminToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (admin) headers["X-Admin-Token"] = admin;
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const type = res.headers.get("content-type") || "";
  const payload = type.includes("application/json") ? await res.json().catch(() => null) : await res.text();
  if (!res.ok) {
    const message = (payload && payload.error && payload.error.message) || `${res.status} ${res.statusText}`;
    const code = payload && payload.error && payload.error.code;
    throw new ApiError(message, res.status, code);
  }
  return payload;
}

export const client = {
  // ---- auth ----
  async signup({ name, rollNo, house, password }) {
    return request("POST", "/auth/signup", { name, rollNo, house, password });
  },
  async login({ rollNo, password }) {
    return request("POST", "/auth/login", { rollNo, password });
  },
  async guest({ house, name } = {}) {
    return request("POST", "/auth/guest", { house, name });
  },
  async logout() {
    return request("POST", "/auth/logout").finally(() => setToken(null));
  },
  me: () => request("GET", "/auth/me"),

  // ---- secretary unlock ----
  async adminUnlock(password) {
    const res = await request("POST", "/auth/admin", { password });
    setAdminToken(res.token);
    return res;
  },
  async adminLock() {
    try { await request("DELETE", "/auth/admin"); } catch {}
    setAdminToken(null);
  },

  // ---- reads ----
  events: (query = {}) => request("GET", `/events?${new URLSearchParams(query)}`),
  ledger: () => request("GET", "/ledger"),
  auditLedger: () => request("GET", "/ledger/audit"),
  leaderboard: () => request("GET", "/leaderboard"),
  announcements: () => request("GET", "/announcements"),
  activity: (query = {}) => request("GET", `/activity?${new URLSearchParams(query)}`),
  peers: (query = {}) => request("GET", `/peers?${new URLSearchParams(query)}`),
  eventCode: (id) => request("GET", `/events/${id}/code`),

  // ---- mutations ----
  proposeEvent: (payload) => request("POST", "/events", payload),
  rsvp: (id) => request("POST", `/events/${id}/rsvp`),
  unrsvp: (id) => request("DELETE", `/events/${id}/rsvp`),
  decide: (id, house, approve, reason) => request("PATCH", `/events/${id}/approvals/${house}`, { approve, reason }),
  updateEvent: (id, patch) => request("PATCH", `/events/${id}`, patch),
  cancelEvent: (id, reason) => request("POST", `/events/${id}/cancel`, { reason }),
  reopenEvent: (id) => request("POST", `/events/${id}/reopen`),
  checkIn: (payload) => request("POST", "/checkins", payload),
  createAnnouncement: (payload) => request("POST", "/announcements", payload),
  deleteAnnouncement: (id) => request("DELETE", `/announcements/${id}`),
  togglePin: (id, pinned) => request("PATCH", `/announcements/${id}`, { pinned }),
  award: (payload) => request("POST", "/admin/award", payload),
  bulkApprove: (ids) => request("POST", "/admin/bulk-approve", { ids }),
  goLive: (payload) => request("POST", "/peers/me", payload),
  goOffline: () => request("DELETE", "/peers/me"),
  ping: (id) => request("POST", `/peers/${id}/ping`)
};
