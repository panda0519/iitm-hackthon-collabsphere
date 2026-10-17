import { asyncHandler } from "../utils/asyncHandler.js";
import { attendanceRows, toCSV } from "@collabsphere/shared";
import * as events from "../services/events.js";
import { listLedger } from "../services/ledger.js";

export const list = asyncHandler((req, res) => {
  res.json(events.listEvents(req.query));
});

export const get = asyncHandler((req, res) => {
  res.json(events.getEvent(req.params.id));
});

export const create = asyncHandler((req, res) => {
  res.status(201).json(events.createEvent(req.user, req.body));
});

export const update = asyncHandler((req, res) => {
  res.json(events.updateEvent(req.user, req.params.id, req.body));
});

export const decide = asyncHandler((req, res) => {
  const approve = req.body.approve === true || req.body.approve === "true";
  res.json(events.decide(req.user, req.params.id, req.params.house, approve, req.body.reason));
});

export const cancel = asyncHandler((req, res) => {
  res.json(events.cancelEvent(req.user, req.params.id, req.body.reason));
});

export const reopen = asyncHandler((req, res) => {
  res.json(events.reopenEvent(req.user, req.params.id));
});

export const rsvp = asyncHandler((req, res) => {
  res.json(events.setRsvp(req.user, req.params.id, true));
});

export const unrsvp = asyncHandler((req, res) => {
  res.json(events.setRsvp(req.user, req.params.id, false));
});

export const attendance = asyncHandler((req, res) => {
  const ev = events.getEvent(req.params.id);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${ev.id}-attendance.csv"`);
  res.send(toCSV(attendanceRows(ev, listLedger())));
});
