import { NOTIFICATION_TYPES } from "../types";
import type { Notification, NotificationType, UserSummary } from "../types";
import type { IconName } from "../components/atoms/Icon";

export type ConnectionsTab = "search" | "requests" | "sent" | "connections";

/**
 * Typed, discriminated link target. Each variant matches a real route's
 * params/search so TanStack Router's <Link> type-checks.
 */
export type NotificationLink =
  | {
      to: "/connections";
      search: { tab: ConnectionsTab; highlight?: number };
    }
  | { to: "/messages"; search: { conversation?: string; message?: string } }
  | { to: "/feed" }
  | { to: "/profile/$userId"; params: { userId: string } }
  | { to: "/posts/$postId"; params: { postId: string } };

export interface NotificationPresentation {
  icon: IconName;
  title: string;
  body: string;
  actorName: string | null;
  link: NotificationLink | null;
}

const ICONS: Record<NotificationType, IconName> = {
  connection_request: "userPlus",
  connection_accepted: "userCheck",
  connection_rejected: "userX",
  new_message: "messages",
  message_reply: "reply",
  post_like: "heart",
  post_comment: "comment",
  post_share: "share",
  user_mention: "atSign",
  user_follow: "user",
  system_announcement: "megaphone",
  account_update: "settings",
};

const fullName = (user: UserSummary | null | undefined): string | null => {
  if (!user) return null;
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || `@${user.username}`;
};

const positiveInt = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

const metaString = (
  notification: Notification,
  key: string,
): string | undefined => {
  const value = notification.metadata?.[key];
  return typeof value === "string" && value ? value : undefined;
};

const FALLBACK_TITLE: Partial<Record<NotificationType, string>> = {
  [NOTIFICATION_TYPES.CONNECTION_REQUEST]: "New connection request",
  [NOTIFICATION_TYPES.CONNECTION_ACCEPTED]: "Connection accepted",
  [NOTIFICATION_TYPES.CONNECTION_REJECTED]: "Connection declined",
  [NOTIFICATION_TYPES.NEW_MESSAGE]: "New message",
  [NOTIFICATION_TYPES.MESSAGE_REPLY]: "New reply to your message",
  [NOTIFICATION_TYPES.POST_LIKE]: "New like on your post",
  [NOTIFICATION_TYPES.POST_COMMENT]: "New comment on your post",
  [NOTIFICATION_TYPES.POST_SHARE]: "Your post was shared",
  [NOTIFICATION_TYPES.USER_MENTION]: "You were mentioned",
  [NOTIFICATION_TYPES.USER_FOLLOW]: "New follower",
  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: "Announcement",
  [NOTIFICATION_TYPES.ACCOUNT_UPDATE]: "Account update",
};

/** Types whose server `message` is boilerplate once we have an actor name. */
const GENERIC_BODY = new Set<NotificationType>([
  NOTIFICATION_TYPES.CONNECTION_REQUEST,
  NOTIFICATION_TYPES.CONNECTION_ACCEPTED,
  NOTIFICATION_TYPES.CONNECTION_REJECTED,
  NOTIFICATION_TYPES.POST_LIKE,
]);

function actorTitle(type: NotificationType, actor: string): string | null {
  switch (type) {
    case NOTIFICATION_TYPES.CONNECTION_REQUEST:
      return `${actor} sent you a connection request`;
    case NOTIFICATION_TYPES.CONNECTION_ACCEPTED:
      return `${actor} accepted your connection request`;
    case NOTIFICATION_TYPES.CONNECTION_REJECTED:
      return `${actor} declined your connection request`;
    case NOTIFICATION_TYPES.NEW_MESSAGE:
      return `New message from ${actor}`;
    case NOTIFICATION_TYPES.MESSAGE_REPLY:
      return `${actor} replied to your message`;
    case NOTIFICATION_TYPES.POST_LIKE:
      return `${actor} liked your post`;
    case NOTIFICATION_TYPES.POST_COMMENT:
      return `${actor} commented on your post`;
    case NOTIFICATION_TYPES.POST_SHARE:
      return `${actor} shared your post`;
    case NOTIFICATION_TYPES.USER_MENTION:
      return `${actor} mentioned you`;
    case NOTIFICATION_TYPES.USER_FOLLOW:
      return `${actor} started following you`;
    default:
      return null;
  }
}

function linkFor(notification: Notification): NotificationLink | null {
  const relatedUserId =
    notification.relatedUserId ?? notification.relatedUser?.id ?? null;
  const toProfile: NotificationLink | null = relatedUserId
    ? { to: "/profile/$userId", params: { userId: String(relatedUserId) } }
    : null;
  const connectionId = positiveInt(notification.relatedEntityId);
  const conversationId = metaString(notification, "conversationId");
  const toPost: NotificationLink | null =
    notification.relatedEntityType === "post" && notification.relatedEntityId
      ? {
          to: "/posts/$postId",
          params: { postId: notification.relatedEntityId },
        }
      : null;

  switch (notification.type) {
    // The action item IS the incoming request → Requests tab, that row.
    case NOTIFICATION_TYPES.CONNECTION_REQUEST:
      return {
        to: "/connections",
        search: {
          tab: "requests",
          ...(connectionId ? { highlight: connectionId } : {}),
        },
      };
    // The item is the now-established connection → Connections tab, that row.
    case NOTIFICATION_TYPES.CONNECTION_ACCEPTED:
      return {
        to: "/connections",
        search: {
          tab: "connections",
          ...(connectionId ? { highlight: connectionId } : {}),
        },
      };
    // Nothing to act on; view the person.
    case NOTIFICATION_TYPES.CONNECTION_REJECTED:
      return toProfile ?? { to: "/connections", search: { tab: "sent" } };
    // Open the conversation, scrolled to the message in question.
    case NOTIFICATION_TYPES.NEW_MESSAGE:
    case NOTIFICATION_TYPES.MESSAGE_REPLY: {
      const messageId =
        notification.relatedEntityType === "message"
          ? (notification.relatedEntityId ?? undefined)
          : undefined;
      return {
        to: "/messages",
        search: conversationId
          ? {
              conversation: conversationId,
              ...(messageId ? { message: messageId } : {}),
            }
          : {},
      };
    }
    case NOTIFICATION_TYPES.POST_LIKE:
    case NOTIFICATION_TYPES.POST_COMMENT:
    case NOTIFICATION_TYPES.POST_SHARE:
      return toPost ?? toProfile ?? { to: "/feed" };
    case NOTIFICATION_TYPES.USER_MENTION:
    case NOTIFICATION_TYPES.USER_FOLLOW:
      return toProfile;
    default:
      return null;
  }
}

export function describeNotification(
  notification: Notification,
): NotificationPresentation {
  const actorName = fullName(notification.relatedUser);
  const composed = actorName ? actorTitle(notification.type, actorName) : null;
  const serverTitle = notification.title?.trim();
  const title =
    composed ??
    (serverTitle && serverTitle.length > 0
      ? serverTitle
      : (FALLBACK_TITLE[notification.type] ?? "Notification"));
  const body =
    composed && GENERIC_BODY.has(notification.type)
      ? ""
      : (notification.message ?? "");
  return {
    icon: ICONS[notification.type] ?? "bell",
    title,
    body,
    actorName,
    link: linkFor(notification),
  };
}
