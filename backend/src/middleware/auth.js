// Request authentication + authorization.
//
// `attachUser` runs on every /api request and resolves the (optional) member session
// and (optional) admin session from headers. `requireUser` / `requireAdmin` are then
// applied per route. Nothing is trusted from the body or query — the identity and the
// secretary scope come only from server-issued tokens.

import { adminForToken, userForToken } from "../services/auth.js";
import { forbidden, unauthorized } from "../utils/errors.js";

const bearer = (req) => {
  const h = req.get("authorization") || "";
  if (h.startsWith("Bearer ")) return h.slice(7).trim();
  return String(req.get("x-session-token") || "").trim() || null;
};

export function attachUser(req, _res, next) {
  req.sessionToken = bearer(req);
  req.adminToken = String(req.get("x-admin-token") || "").trim() || null;
  req.user = userForToken(req.sessionToken); // null when not signed in
  req.admin = adminForToken(req.adminToken); // null when the console is locked
  next();
}

export function requireUser(req, _res, next) {
  if (!req.user) return next(unauthorized("Sign in to continue.", "AUTH_REQUIRED"));
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.admin) return next(unauthorized("Unlock the Admin console first.", "ADMIN_REQUIRED"));
  next();
}

/** Admin token must belong to the same house as an action's target house. */
export function requireOwnHouse(houseOf) {
  return (req, _res, next) => {
    if (!req.admin) return next(unauthorized("Unlock the Admin console first.", "ADMIN_REQUIRED"));
    const house = houseOf(req);
    if (house && house !== req.admin.house) {
      return next(forbidden(`Your secretary credentials are scoped to ${req.admin.house}.`, "WRONG_HOUSE"));
    }
    next();
  };
}
