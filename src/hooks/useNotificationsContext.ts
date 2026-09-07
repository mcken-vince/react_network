// The NotificationProvider has been removed; notifications are plain React
// Query now. This shim keeps `useNotifications()` call sites working. New code
// should use useNotificationsFeature() / the individual hooks directly.
import {
  useNotificationsFeature,
  type NotificationsFeature,
} from "./useNotifications";

export interface NotificationsContextValue extends NotificationsFeature {
  /** Alias of `refresh`, kept for existing callers. */
  refreshNotifications: () => void;
}

export const useNotifications = (): NotificationsContextValue => {
  const feature = useNotificationsFeature();
  return { ...feature, refreshNotifications: feature.refresh };
};
