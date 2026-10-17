// Tiny request-body validators shared by the controllers.
import { badRequest } from "../utils/errors.js";

const isString = (v) => typeof v === "string";
const isNumber = (v) => typeof v === "number" && Number.isFinite(v);

/**
 * Ensure every named field is present and (optionally) non-empty. Returns a
 * shallow copy of the body so controllers can read typed values.
 */
export function requireFields(body, spec) {
  const out = {};
  for (const [key, kind] of Object.entries(spec)) {
    const v = body ? body[key] : undefined;
    if (v === undefined || v === null || v === "") throw badRequest(`Missing field: ${key}`, "VALIDATION");
    if (kind === "string" && !isString(v)) throw badRequest(`Field ${key} must be a string`, "VALIDATION");
    if (kind === "number" && !isNumber(Number(v))) throw badRequest(`Field ${key} must be a number`, "VALIDATION");
    if (kind === "boolean" && typeof v !== "boolean") throw badRequest(`Field ${key} must be a boolean`, "VALIDATION");
    out[key] = kind === "number" ? Number(v) : v;
  }
  return out;
}
