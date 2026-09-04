// Moved to /shared (identical on both sides of the wire). This re-export keeps
// existing `../config/notificationTypes` imports working; prefer importing from
// "../types" (or "@shared/notificationTypes") in new code.
export {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_VALUES,
  NOTIFICATION_CONFIG,
} from "@shared/notificationTypes";
export type {
  NotificationType,
  NotificationCategory,
  NotificationConfigItem,
} from "@shared/notificationTypes";
