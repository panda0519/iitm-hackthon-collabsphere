import { Router } from "express";
import * as c from "../controllers/auth.js";
import { requireUser, requireAdmin } from "../middleware/auth.js";

const r = Router();

r.post("/signup", c.signup);
r.post("/login", c.login);
r.post("/guest", c.guest);
r.post("/logout", c.logout);
r.get("/me", requireUser, c.me);
r.post("/admin", requireUser, c.unlockAdmin); // exchange the secretary password for an admin token
r.delete("/admin", requireAdmin, c.lockAdmin);

export default r;
