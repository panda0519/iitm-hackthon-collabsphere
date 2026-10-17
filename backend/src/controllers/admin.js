import { asyncHandler } from "../utils/asyncHandler.js";
import * as admin from "../services/admin.js";

export const award = asyncHandler((req, res) => {
  res.json(admin.award(req.user, req.body));
});

export const bulkApprove = asyncHandler((req, res) => {
  res.json(admin.bulkApprove(req.user, req.body.ids));
});

export const exportAll = asyncHandler((_req, res) => {
  res.json(admin.exportAll());
});
