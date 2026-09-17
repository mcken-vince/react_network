export const NOTIFICATION_TYPES = {
  // Connection
  CONNECTION_REQUEST: "connection_request",
  CONNECTION_ACCEPTED: "connection_accepted",
  CONNECTION_REJECTED: "connection_rejected",
  // Messaging
  NEW_MESSAGE: "new_message",
  MESSAGE_REPLY: "message_reply",
  // Posts
  POST_LIKE: "post_like",
  POST_COMMENT: "post_comment",
  POST_SHARE: "post_share",
  // Users
  USER_MENTION: "user_mention",
  USER_FOLLOW: "user_follow",
  // System
  SYSTEM_ANNOUNCEMENT: "system_announcement",
  ACCOUNT_UPDATE: "account_update",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_TYPE_VALUES = Object.values(
  NOTIFICATION_TYPES,
) as NotificationType[];

export type NotificationCategory =
  | "connection"
  | "messaging"
  | "engagement"
  | "user"
  | "system";

export interface NotificationConfigItem {
  icon: string;
  color: string;
  actionable: boolean;
  category: NotificationCategory;
}

export const NOTIFICATION_CONFIG: Record<
  NotificationType,
  NotificationConfigItem
> = {
  connection_request: {
    icon: "🤝",
    color: "blue",
    actionable: true,
    category: "connection",
  },
  connection_accepted: {
    icon: "✅",
    color: "green",
    actionable: false,
    category: "connection",
  },
  connection_rejected: {
    icon: "❌",
    color: "red",
    actionable: false,
    category: "connection",
  },
  new_message: {
    icon: "💬",
    color: "blue",
    actionable: true,
    category: "messaging",
  },
  message_reply: {
    icon: "↩️",
    color: "blue",
    actionable: true,
    category: "messaging",
  },
  post_like: {
    icon: "❤️",
    color: "red",
    actionable: false,
    category: "engagement",
  },
  post_comment: {
    icon: "💬",
    color: "green",
    actionable: false,
    category: "engagement",
  },
  post_share: {
    icon: "🔄",
    color: "purple",
    actionable: false,
    category: "engagement",
  },
  user_mention: {
    icon: "📣",
    color: "orange",
    actionable: true,
    category: "user",
  },
  user_follow: {
    icon: "👤",
    color: "teal",
    actionable: true,
    category: "user",
  },
  system_announcement: {
    icon: "📢",
    color: "gray",
    actionable: false,
    category: "system",
  },
  account_update: {
    icon: "🔧",
    color: "blue",
    actionable: true,
    category: "system",
  },
};
