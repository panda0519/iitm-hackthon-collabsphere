import { Router } from "express";
import * as c from "../controllers/peers.js";
import { requireUser } from "../middleware/auth.js";

const r = Router();

r.get("/", requireUser, c.list);
r.post("/me", requireUser, c.goLive);
r.delete("/me", requireUser, c.goOffline);
r.post("/:id/ping", requireUser, c.ping);

export default r;
