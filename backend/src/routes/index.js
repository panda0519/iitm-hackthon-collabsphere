// One router per resource, mounted under /api by server.js.
import { Router } from "express";
import auth from "./auth.js";
import events from "./events.js";
import checkins from "./checkins.js";
import ledger from "./ledger.js";
import leaderboard from "./leaderboard.js";
import announcements from "./announcements.js";
import activity from "./activity.js";
import peers from "./peers.js";
import admin from "./admin.js";

const api = Router();

api.use("/auth", auth);
api.use("/events", events);
api.use("/checkins", checkins);
api.use("/ledger", ledger);
api.use("/leaderboard", leaderboard);
api.use("/announcements", announcements);
api.use("/activity", activity);
api.use("/peers", peers);
api.use("/admin", admin);

export default api;
