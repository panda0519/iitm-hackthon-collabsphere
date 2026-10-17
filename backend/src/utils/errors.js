// Small typed error that the error handler turns into the API's JSON envelope
// { error: { message, code } }.

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message, code = "BAD_REQUEST") => new HttpError(400, code, message);
export const notFound = (message, code = "NOT_FOUND") => new HttpError(404, code, message);
export const conflict = (message, code = "CONFLICT") => new HttpError(409, code, message);
export const forbidden = (message, code = "FORBIDDEN") => new HttpError(403, code, message);
export const unauthorized = (message, code = "UNAUTHORIZED") => new HttpError(401, code, message);
