import { Notification } from "../models";
import { includeUser } from "../models/includes";
import { toWire } from "../lib/serialize";
import { emitToUser } from "../websocket/io";
import type {
  Notification as NotificationDto,
  NotificationFilters,
} from "../types";

/** Reload with `relatedUser` so socket payloads match GET /notifications. */
async function hydrate(notification: Notification): Promise<Notification> {
  const full = await Notification.findByPk(notification.id, {
    include: [includeUser("relatedUser")],
  });
  return full ?? notification;
}

/**
 * Persist and push a notification. Never throws — a failed notification must
 * not fail the action that triggered it.
 */
async function deliver(
  create: () => Promise<Notification>,
): Promise<Notification | null> {
  try {
    const notification = await hydrate(await create());
    emitToUser(
      notification.userId,
      "notification:new",
      toWire<NotificationDto>(notification),
    );
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Triggers
// ---------------------------------------------------------------------------

export function notifyConnectionRequested(
  recipientId: number,
  requesterId: number,
  connectionId: number,
): Promise<Notification | null> {
  return deliver(() =>
    Notification.createConnectionRequestNotification(
      recipientId,
      requesterId,
      connectionId,
    ),
  );
}

export function notifyConnectionAccepted(
  requesterId: number,
  accepterId: number,
  connectionId: number,
): Promise<Notification | null> {
  return deliver(() =>
    Notification.createConnectionAcceptedNotification(
      requesterId,
      accepterId,
      connectionId,
    ),
  );
}

export function notifyConnectionRejected(
  requesterId: number,
  rejecterId: number,
  connectionId: number,
): Promise<Notification | null> {
  return deliver(() =>
    Notification.createConnectionRejectedNotification(
      requesterId,
      rejecterId,
      connectionId,
    ),
  );
}

// ---------------------------------------------------------------------------
// Reads / mutations (used by both REST routes and socket handlers)
// ---------------------------------------------------------------------------

export function listNotifications(
  userId: number,
  filters: NotificationFilters = {},
): Promise<Notification[]> {
  return Notification.getUserNotifications(userId, filters);
}

export function getUnreadNotificationCount(userId: number): Promise<number> {
  return Notification.getUnreadCount(userId);
}

/** @throws NotFoundError */
export async function markNotificationRead(
  notificationId: number,
  userId: number,
): Promise<Notification> {
  const notification = await hydrate(
    await Notification.markAsRead(notificationId, userId),
  );
  emitToUser(
    userId,
    "notification:updated",
    toWire<NotificationDto>(notification),
  );
  return notification;
}

/** @returns number of notifications affected */
export async function markAllNotificationsRead(
  userId: number,
): Promise<number> {
  const affected = await Notification.markAllAsRead(userId);
  emitToUser(userId, "notification:allRead");
  return affected;
}

/** @throws NotFoundError */
export async function deleteNotification(
  notificationId: number,
  userId: number,
): Promise<void> {
  await Notification.deleteNotification(notificationId, userId);
  emitToUser(userId, "notification:deleted", notificationId);
}
