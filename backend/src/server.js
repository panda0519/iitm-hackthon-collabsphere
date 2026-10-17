// Express bootstrap. Mounts the API under /api, seeds the SQLite database on first
// run, and exposes a tiny /health probe.

import express from "express";
import cors from "cors";
import { CORS_ORIGIN, PORT, TOTP_SECRET_IS_EPHEMERAL } from "./config/index.js";
import { getDb } from "./db/index.js";
import { attachUser } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import api from "./routes/index.js";

const app = express();

app.use(cors({ origin: CORS_ORIGIN, allowedHeaders: ["Content-Type", "Authorization", "X-Session-Token", "X-Admin-Token"] }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "collabsphere-api" }));

// Every API request gets its identity resolved from server-issued tokens (or nothing).
app.use("/api", attachUser, api);

app.use(notFoundHandler);
app.use(errorHandler);

// Seed before listening so the first request already has data.
getDb();

if (TOTP_SECRET_IS_EPHEMERAL) {
  console.warn("[config] TOTP_SECRET not set — using a random per-boot secret. Check-in codes will not survive a restart.");
}

app.listen(PORT, () => {
  console.log(`CollabSphere API listening on http://localhost:${PORT}`);
});

export default app;
