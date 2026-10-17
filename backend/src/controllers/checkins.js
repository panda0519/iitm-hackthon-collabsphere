import { asyncHandler } from "../utils/asyncHandler.js";
import { currentCode, claimCheckIn } from "../services/checkins.js";

export const code = asyncHandler((req, res) => {
  res.json(currentCode(req.params.id));
});

export const claim = asyncHandler((req, res) => {
  res.status(201).json(claimCheckIn(req.user, req.body));
});
