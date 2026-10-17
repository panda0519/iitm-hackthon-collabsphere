import { asyncHandler } from "../utils/asyncHandler.js";
import * as announcements from "../services/announcements.js";

export const list = asyncHandler((req, res) => {
  res.json(announcements.listAnnouncements(req.user));
});

export const create = asyncHandler((req, res) => {
  res.status(201).json(announcements.createAnnouncement(req.user, req.body));
});

export const update = asyncHandler((req, res) => {
  res.json(announcements.updateAnnouncement(req.user, req.params.id, req.body));
});

export const remove = asyncHandler((req, res) => {
  res.json(announcements.deleteAnnouncement(req.user, req.params.id));
});
