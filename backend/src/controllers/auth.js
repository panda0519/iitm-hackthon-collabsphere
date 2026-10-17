import { asyncHandler } from "../utils/asyncHandler.js";
import * as auth from "../services/auth.js";

export const signup = asyncHandler((req, res) => {
  res.status(201).json(auth.signup(req.body));
});

export const login = asyncHandler((req, res) => {
  res.json(auth.login(req.body));
});

export const guest = asyncHandler((req, res) => {
  res.json(auth.guest(req.body));
});

export const logout = asyncHandler((req, res) => {
  res.json(auth.logout(req.sessionToken));
});

export const me = asyncHandler((req, res) => {
  res.json(req.user);
});

export const unlockAdmin = asyncHandler((req, res) => {
  res.json(auth.unlockAdmin(req.user, req.body.password));
});

export const lockAdmin = asyncHandler((req, res) => {
  res.json(auth.logoutAdmin(req.adminToken));
});
