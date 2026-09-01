export type FieldErrors = Record<string, string>;

/**
 * Errors that carry an HTTP status (and optionally field-level messages).
 * Thrown from models/services; mapped to responses by lib/http.ts.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly errors: FieldErrors | undefined;

  constructor(status: number, message: string, errors?: FieldErrors) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.errors = errors;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Bad request", errors?: FieldErrors) {
    super(400, message, errors);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not found") {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflict", errors?: FieldErrors) {
    super(409, message, errors);
  }
}
