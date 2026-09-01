import type { NextFunction, RequestHandler, Response } from "express";
import { UniqueConstraintError, ValidationError } from "sequelize";
import { BadRequestError, HttpError } from "./errors";
import type { FieldErrors } from "./errors";
import { sendError, sendSequelizeValidationError } from "../utils/responses";
import type { ValidationResult } from "../utils/validation";
import { LIMITS } from "../../shared/limits";
import type {
  ApiRequest,
  AuthRequest,
  AuthenticatedRequest,
  PaginationParams,
} from "../types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Handler<R> = (req: R, res: Response) => Promise<void>;

// ---------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------

/** Map a thrown error to a response; anything unrecognised goes to errorHandler. */
function respondWithError(
  res: Response,
  error: unknown,
  next: NextFunction,
): void {
  if (error instanceof HttpError) {
    sendError(res, error.status, error.message, error.errors);
    return;
  }
  // Must precede ValidationError — UniqueConstraintError extends it.
  if (error instanceof UniqueConstraintError) {
    const errors: FieldErrors = {};
    for (const item of error.errors) {
      if (item.path) errors[item.path] = `${item.path} already exists`;
    }
    sendError(res, 409, "Already exists", errors);
    return;
  }
  if (error instanceof ValidationError) {
    sendSequelizeValidationError(res, error);
    return;
  }
  next(error);
}

// ---------------------------------------------------------------------------
// Handler wrappers
// ---------------------------------------------------------------------------

/** Public route: async handler with centralised error mapping. */
export function route(handler: Handler<ApiRequest>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch((error: unknown) => respondWithError(res, error, next));
  };
}

/** Protected route. `authenticateToken` must have run (use `router.use(authenticateToken)`). */
export function authed(handler: Handler<AuthenticatedRequest>): RequestHandler {
  return (req, res, next) => {
    const { userId } = req as AuthRequest;
    if (userId === undefined) {
      sendError(res, 401, "Access token required");
      return;
    }
    Promise.resolve()
      .then(() => handler(req as AuthenticatedRequest, res))
      .catch((error: unknown) => respondWithError(res, error, next));
  };
}

// ---------------------------------------------------------------------------
// Input readers — every one throws BadRequestError on bad input
// ---------------------------------------------------------------------------

/** Unwrap a validator result or throw a 400 carrying its field errors. */
export function validated<T>(result: ValidationResult<T>): T {
  if (result.error) {
    throw new BadRequestError(result.error.message, result.error.errors);
  }
  return result.data;
}

export function requiredParam(req: ApiRequest, name: string): string {
  const value = req.params[name];
  if (!value) throw new BadRequestError(`${name} is required`);
  return value;
}

export function intParam(req: ApiRequest, name: string): number {
  const value = Number.parseInt(requiredParam(req, name), 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new BadRequestError(`Invalid ${name}`);
  }
  return value;
}

export function uuidParam(req: ApiRequest, name: string): string {
  const value = requiredParam(req, name);
  if (!UUID_RE.test(value)) throw new BadRequestError(`Invalid ${name}`);
  return value;
}

export function queryString(req: ApiRequest, name: string): string | undefined {
  const value = req.query[name];
  return typeof value === "string" ? value : undefined;
}

export function queryInt(req: ApiRequest, name: string): number | undefined {
  const raw = queryString(req, name);
  if (raw === undefined) return undefined;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 0) {
    throw new BadRequestError(`${name} must be a non-negative integer`);
  }
  return value;
}

export function queryBool(req: ApiRequest, name: string): boolean {
  return queryString(req, name) === "true";
}

/** `limit` (clamped to the max) and `offset` from the query string. */
export function pagination(req: ApiRequest): Required<PaginationParams> {
  return {
    limit: Math.min(
      queryInt(req, "limit") ?? LIMITS.PAGE_LIMIT_DEFAULT,
      LIMITS.PAGE_LIMIT_MAX,
    ),
    offset: queryInt(req, "offset") ?? 0,
  };
}

function bodyField(req: ApiRequest, name: string): unknown {
  const { body } = req;
  return typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)[name]
    : undefined;
}

/** A single positive-integer body field (for bodies too small to warrant a validator). */
export function bodyInt(req: ApiRequest, name: string): number {
  const raw = bodyField(req, name);
  const value =
    typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isInteger(value) || value <= 0) {
    const message = `A valid ${name} is required`;
    throw new BadRequestError(message, { [name]: message });
  }
  return value;
}

/** An optional array-of-strings body field; absent → []. */
export function bodyStringArray(req: ApiRequest, name: string): string[] {
  const raw = bodyField(req, name);
  if (raw === undefined) return [];
  if (
    !Array.isArray(raw) ||
    !raw.every((item): item is string => typeof item === "string")
  ) {
    throw new BadRequestError(`${name} must be an array of strings`);
  }
  return raw;
}
