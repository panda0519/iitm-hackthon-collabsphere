// JSON error envelope + 404. Shape matches docs/API.md:
//   { error: { message, code } }
import { IS_PRODUCTION } from "../config/index.js";
import { HttpError } from "../utils/errors.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.path}`, code: "NOT_FOUND" } });
}

// eslint-disable-next-line no-unused-vars -- Express identifies the error handler by arity
export function errorHandler(err, req, res, next) {
  const status = err instanceof HttpError ? err.status : 500;
  const code = err instanceof HttpError ? err.code : "INTERNAL";
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: {
      message: status >= 500 && IS_PRODUCTION ? "Internal server error" : err.message || "Unexpected error",
      code
    }
  });
}
