import { asyncHandler } from "../utils/asyncHandler.js";
import { leaderboard } from "../services/leaderboard.js";

export const get = asyncHandler((_req, res) => {
  res.json(leaderboard());
});
