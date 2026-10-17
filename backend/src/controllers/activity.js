import { asyncHandler } from "../utils/asyncHandler.js";
import { toCSV } from "@collabsphere/shared";
import { activityRows, listActivity } from "../services/activity.js";

export const list = asyncHandler((req, res) => {
  res.json(listActivity(req.query));
});

export const exportCsv = asyncHandler((_req, res) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="collabsphere-activity.csv"');
  res.send(toCSV(activityRows()));
});
