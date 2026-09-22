import { Notification } from "../models";
import { includeUser } from "../models/includes";
import type { ReactionTarget } from "../models/types";
import { toWire } from "../lib/serialize";
import { emitToUser } from "../websocket/io";
import type {
  Notification as NotificationDto,
  NotificationFilters,
  ReactionType,
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

/** Mark this conversation's unread message + reaction notifications read and push the change. */
export async function markConversationNotificationsRead(
  userId: number,
  conversationId: string,
): Promise<void> {
  const unread = await Notification.findUnreadForConversation(
    userId,
    conversationId,
    { includeReactions: true },
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
// Triggers — reactions (posts, comments, messages)
// ---------------------------------------------------------------------------

interface ReactionNotificationChange {
  ownerId: number;
  reactorId: number;
  target: ReactionTarget;
  /** The reactor's reactions on the target before/after, oldest first. */
  before: readonly ReactionType[];
  after: readonly ReactionType[];
  added: ReactionType | null;
}

/**
 * Keep at most one unread reaction notification per (reactor, target):
 *  - first reaction           → create one
 *  - switch / add another     → update the unread one in place (no new ping)
 *  - all reactions removed    → delete the unread one
 * Read notifications are left alone. Never throws.
 */
export async function syncReactionNotification(
  change: ReactionNotificationChange,
): Promise<void> {
  const { ownerId, reactorId, target, before, after, added } = change;
  if (ownerId === reactorId) return;
  try {
    const existing = await Notification.findUnreadReaction(
      ownerId,
      reactorId,
      target,
    );

    if (after.length === 0) {
      if (existing) {
        await existing.destroy();
        emitToUser(ownerId, "notification:deleted", existing.id);
      }
      return;
    }

    const latest = added ?? after[after.length - 1];
    if (!latest) return;

    if (existing) {
      const updated = await Notification.refreshReactionNotification(
        existing,
        target,
        latest,
      );
      emitToUser(
        ownerId,
        "notification:updated",
        toWire<NotificationDto>(await hydrate(updated)),
      );
      return;
    }

    if (before.length === 0 && added) {
      await deliver(() =>
        Notification.createReactionNotification(
          ownerId,
          reactorId,
          target,
          added,
        ),
      );
    }
  } catch (error) {
    console.error("Failed to sync reaction notification:", error);
  }
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
