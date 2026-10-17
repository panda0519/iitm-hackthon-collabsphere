import { Router } from "express";
import * as c from "../controllers/events.js";
import { code } from "../controllers/checkins.js";
import { requireUser, requireAdmin, requireOwnHouse } from "../middleware/auth.js";

const r = Router();

// Public reads (a discovery map is meant to be browsable).
r.get("/", c.list);
r.get("/:id", c.get);

// Members: propose and RSVP.
r.post("/", requireUser, c.create);
r.post("/:id/rsvp", requireUser, c.rsvp);
r.delete("/:id/rsvp", requireUser, c.unrsvp);
r.get("/:id/code", requireUser, code);

// Secretaries: approve / edit / cancel / reopen / export.
r.patch("/:id/approvals/:house", requireUser, requireOwnHouse((req) => req.params.house), c.decide);
r.patch("/:id", requireUser, requireAdmin, c.update);
r.post("/:id/cancel", requireUser, requireAdmin, c.cancel);
r.post("/:id/reopen", requireUser, requireAdmin, c.reopen);
r.get("/:id/attendance", requireUser, requireAdmin, c.attendance);

export default r;
