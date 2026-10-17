import { Router } from "express";
import * as c from "../controllers/ledger.js";
import { requireUser, requireAdmin } from "../middleware/auth.js";

const r = Router();

// The ledger and its audit are public read-only proof; the CSV dump is secretary-only.
r.get("/", c.list);
r.get("/audit", c.audit);
r.get("/export", requireUser, requireAdmin, c.exportCsv);

export default r;
