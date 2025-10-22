import { createContext, ReactNode, useCallback, useEffect } from "react";
import {
  useNotificationsList,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from "../hooks/useNotifications";
import { useWebSocket } from "./WebSocketContext";
import type { Notification } from "../types";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  loadNotifications: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => void;
  isMarkingAsRead: boolean;
  isMarkingAllAsRead: boolean;
  isDeletingNotification: boolean;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export { NotificationContext };

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const {
    markNotificationAsRead: markAsReadViaSocket,
    markAllNotificationsAsRead: markAllAsReadViaSocket,
  } = useWebSocket();

  // Use React Query hooks for data and mutations
  const {
    data: notifications = [],
    isLoading,
    refetch: refetchNotifications,
    isFetching: isRefreshingNotifications,
  } = useNotificationsList();

  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount,
    isFetching: isRefreshingCount,
  } = useUnreadNotificationCount();

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  // Load notifications (refetch)
  const loadNotifications = useCallback(async () => {
    await refetchNotifications();
  }, [refetchNotifications]);

  // Load unread count (refetch)
  const loadUnreadCount = useCallback(async () => {
    await refetchUnreadCount();
  }, [refetchUnreadCount]);

  // Mark notification as read (use WebSocket for real-time)
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Send via WebSocket for real-time update
      markAsReadViaSocket(notificationId);
      // Also update via API for persistence
      return markAsReadMutation.mutateAsync(notificationId);
    },
    [markAsReadMutation, markAsReadViaSocket]
  );

  // Mark all notifications as read (use WebSocket for real-time)
  const markAllAsRead = useCallback(async () => {
    // Send via WebSocket for real-time update
    markAllAsReadViaSocket();
    // Also update via API for persistence
    return markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation, markAllAsReadViaSocket]);

  // Delete a notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      return deleteNotificationMutation.mutateAsync(notificationId);
    },
    [deleteNotificationMutation]
  );

  // Refresh both notifications and unread count
  const refreshNotifications = useCallback(() => {
    refetchNotifications();
    refetchUnreadCount();
  }, [refetchNotifications, refetchUnreadCount]);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing: isRefreshingNotifications || isRefreshingCount,
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
