import type { Request } from "express";

// Wire-format entities, request/response shapes, and socket event maps are
// shared with the client so the two sides cannot drift.
export * from "../../shared/types";
export * from "../../shared/socketEvents";
export {
  NOTIFICATION_TYPES,
  NOTIFICATION_CONFIG,
} from "../../shared/notificationTypes";
export type { NotificationType } from "../../shared/notificationTypes";

/** An Express request after `authenticateToken` has populated `userId`. */
export interface AuthRequest extends Request {
  userId?: number;
}
