import { Router } from "express";
import * as c from "../controllers/admin.js";
import { requireUser, requireAdmin } from "../middleware/auth.js";

const r = Router();

r.post("/award", requireUser, requireAdmin, c.award);
r.post("/bulk-approve", requireUser, requireAdmin, c.bulkApprove);
r.get("/export", requireUser, requireAdmin, c.exportAll);

export default r;
