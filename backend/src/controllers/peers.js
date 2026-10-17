import { asyncHandler } from "../utils/asyncHandler.js";
import * as peers from "../services/peers.js";

export const list = asyncHandler((req, res) => {
  res.json(peers.listPeers(req.user, req.query));
});

export const goLive = asyncHandler((req, res) => {
  res.json(peers.goLive(req.user, req.body));
});

export const goOffline = asyncHandler((_req, res) => {
  res.json(peers.goOffline());
});

export const ping = asyncHandler((req, res) => {
  res.json(peers.togglePing(req.user, req.params.id));
});
