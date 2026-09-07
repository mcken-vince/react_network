import { NOTIFICATION_CONFIG, NOTIFICATION_TYPES } from "../types";
import type { Notification, NotificationType, UserSummary } from "../types";

/** Typed, discriminated link target so TanStack Router's <Link> stays sound. */
export type NotificationLink =
  | { to: "/connections" | "/messages" | "/feed" }
  | { to: "/profile/$userId"; params: { userId: string } };

export interface NotificationPresentation {
  icon: string;
  /** One-line, human-readable summary (includes the actor when known). */
  title: string;
  /** Supporting detail (e.g. a message preview); "" when it adds nothing. */
  body: string;
  actorName: string | null;
  link: NotificationLink | null;
}

const fullName = (user: UserSummary | null | undefined): string | null => {
  if (!user) return null;
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || `@${user.username}`;
};

const FALLBACK_TITLE: Partial<Record<NotificationType, string>> = {
  [NOTIFICATION_TYPES.CONNECTION_REQUEST]: "New connection request",
  [NOTIFICATION_TYPES.CONNECTION_ACCEPTED]: "Connection accepted",
  [NOTIFICATION_TYPES.CONNECTION_REJECTED]: "Connection declined",
  [NOTIFICATION_TYPES.NEW_MESSAGE]: "New message",
  [NOTIFICATION_TYPES.POST_LIKE]: "New like on your post",
  [NOTIFICATION_TYPES.POST_COMMENT]: "New comment on your post",
  [NOTIFICATION_TYPES.POST_SHARE]: "Your post was shared",
  [NOTIFICATION_TYPES.USER_MENTION]: "You were mentioned",
  [NOTIFICATION_TYPES.USER_FOLLOW]: "New follower",
  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: "Announcement",
  [NOTIFICATION_TYPES.ACCOUNT_UPDATE]: "Account update",
};

/** Types whose server `message` is boilerplate once the title names the actor. */
const GENERIC_BODY = new Set<NotificationType>([
  NOTIFICATION_TYPES.CONNECTION_REQUEST,
  NOTIFICATION_TYPES.CONNECTION_ACCEPTED,
  NOTIFICATION_TYPES.CONNECTION_REJECTED,
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

  switch (notification.type) {
    case NOTIFICATION_TYPES.CONNECTION_REQUEST:
      return { to: "/connections" };
    case NOTIFICATION_TYPES.CONNECTION_ACCEPTED:
    case NOTIFICATION_TYPES.CONNECTION_REJECTED:
      return toProfile ?? { to: "/connections" };
    case NOTIFICATION_TYPES.NEW_MESSAGE:
      return { to: "/messages" };
    case NOTIFICATION_TYPES.POST_LIKE:
    case NOTIFICATION_TYPES.POST_COMMENT:
    case NOTIFICATION_TYPES.POST_SHARE:
      return toProfile ?? { to: "/feed" };
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
  const config = NOTIFICATION_CONFIG[notification.type];
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
    icon: config?.icon ?? "🔔",
    title,
    body,
    actorName,
    link: linkFor(notification),
  };
}
