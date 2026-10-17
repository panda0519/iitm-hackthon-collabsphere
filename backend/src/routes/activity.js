import { Router } from "express";
import * as c from "../controllers/activity.js";
import { requireUser, requireAdmin } from "../middleware/auth.js";

const r = Router();

r.get("/", requireUser, c.list);
r.get("/export", requireUser, requireAdmin, c.exportCsv);

export default r;
