import { Notification } from "../models";
import { includeUser } from "../models/includes";
import { toWire } from "../lib/serialize";
import { emitToUser } from "../websocket/io";
import { NOTIFICATION_TYPES } from "../../shared/notificationTypes";
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
 * Persist and push a notification. `create` may return null to skip (dedupe).
 * Never throws — a failed notification must not fail the action that
 * triggered it.
 */
async function deliver(
  create: () => Promise<Notification | null>,
): Promise<Notification | null> {
  try {
    const created = await create();
    if (!created) return null;
    const notification = await hydrate(created);
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
// Triggers — connections
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
// Triggers — messaging
// ---------------------------------------------------------------------------

/**
 * At most one unread "new message" notification per conversation per user.
 * It is cleared by `markConversationNotificationsRead` when they open the chat.
 */
export function notifyNewMessage(
  recipientId: number,
  senderId: number,
  messageId: string,
  conversationId: string,
  preview: string,
): Promise<Notification | null> {
  return deliver(async () => {
    const existing = await Notification.findUnreadForConversation(
      recipientId,
      conversationId,
    );
    if (existing.length > 0) return null;
    return Notification.createMessageNotification(
      recipientId,
      senderId,
      messageId,
      conversationId,
      preview,
    );
  });
}

/**
 * Someone replied to the recipient's own message. Not deduped: each reply is
 * a specific, actionable event (unlike a generic "new message").
 */
export function notifyMessageReply(
  recipientId: number,
  senderId: number,
  messageId: string,
  conversationId: string,
  repliedToMessageId: string,
  preview: string,
): Promise<Notification | null> {
  return deliver(() =>
    Notification.createMessageReplyNotification(
      recipientId,
      senderId,
      messageId,
      conversationId,
      repliedToMessageId,
      preview,
    ),
  );
}

/** Mark this conversation's unread message notifications read and push the change. */
export async function markConversationNotificationsRead(
  userId: number,
  conversationId: string,
): Promise<void> {
  const unread = await Notification.findUnreadForConversation(
    userId,
    conversationId,
  );
  for (const notification of unread) {
    await notification.update({ isRead: true });
    emitToUser(
      userId,
      "notification:updated",
      toWire<NotificationDto>(await hydrate(notification)),
    );
  }
}

// ---------------------------------------------------------------------------
// Triggers — posts
// ---------------------------------------------------------------------------

/** Like toggling shouldn't spam: skip if an unread like from this user on this post exists. */
export function notifyPostLiked(
  ownerId: number,
  likerId: number,
  postId: string,
): Promise<Notification | null> {
  return deliver(async () => {
    const duplicate = await Notification.hasUnread({
      userId: ownerId,
      type: NOTIFICATION_TYPES.POST_LIKE,
      isRead: false,
      relatedUserId: likerId,
      relatedEntityType: "post",
      relatedEntityId: postId,
    });
    if (duplicate) return null;
    return Notification.createPostLikeNotification(ownerId, likerId, postId);
  });
}

export function notifyPostCommented(
  ownerId: number,
  commenterId: number,
  postId: string,
  commentId: string,
  preview: string,
): Promise<Notification | null> {
  return deliver(() =>
    Notification.createPostCommentNotification(
      ownerId,
      commenterId,
      postId,
      commentId,
      preview,
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
