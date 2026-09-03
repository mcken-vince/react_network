import type { Request } from "express";

// Wire-format entities, request/response shapes, and socket event maps are
// shared with the client so the two sides cannot drift.
export * from "../../shared/types";
export * from "../../shared/socketEvents";

/**
 * Request with body (and response body) typed as `unknown`: the only way to
 * read the body is through a validator in utils/validation.ts.
 */
export type ApiRequest = Request<Record<string, string>, unknown, unknown>;

/** Before `authenticateToken` has run — `userId` may be absent. */
export interface AuthRequest extends ApiRequest {
  userId?: number;
}

/** Inside a handler wrapped by `authed()` — `userId` is guaranteed. */
export interface AuthenticatedRequest extends ApiRequest {
  userId: number;
}
