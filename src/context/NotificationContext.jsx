import { createContext } from "react";
import {
  useNotificationsList,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from "../hooks/useNotifications";

const NotificationContext = createContext();

export { NotificationContext };

export const NotificationProvider = ({ children }) => {
  // Use React Query hooks for data and mutations
  const {
    data: notifications = [],
    isLoading,
    refetch: refetchNotifications,
  } = useNotificationsList();

  const { data: unreadCount = 0, refetch: refetchUnreadCount } =
    useUnreadNotificationCount();

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  // Load notifications (refetch)
  const loadNotifications = async () => {
    return refetchNotifications();
  };

  // Load unread count (refetch)
  const loadUnreadCount = async () => {
    return refetchUnreadCount();
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    return markAsReadMutation.mutateAsync(notificationId);
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    return markAllAsReadMutation.mutateAsync();
  };

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    return deleteNotificationMutation.mutateAsync(notificationId);
  };

  // Refresh both notifications and unread count
  const refreshNotifications = () => {
    refetchNotifications();
    refetchUnreadCount();
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    // Expose mutation states for UI feedback
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
