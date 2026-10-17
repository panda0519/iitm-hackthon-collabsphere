import { Router } from "express";
import * as c from "../controllers/announcements.js";
import { requireUser, requireAdmin } from "../middleware/auth.js";

const r = Router();

r.get("/", requireUser, c.list);
r.post("/", requireUser, requireAdmin, c.create);
r.patch("/:id", requireUser, requireAdmin, c.update);
r.delete("/:id", requireUser, requireAdmin, c.remove);

export default r;
