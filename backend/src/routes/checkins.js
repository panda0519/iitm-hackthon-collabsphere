import { Router } from "express";
import * as c from "../controllers/checkins.js";
import { requireUser } from "../middleware/auth.js";

const r = Router();

r.post("/", requireUser, c.claim);

export default r;
