import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../utils/api';

// Query Keys
export const notificationKeys = {
  all: ['notifications'],
  lists: () => [...notificationKeys.all, 'list'],
  list: (filters) => [...notificationKeys.lists(), { filters }],
  unreadCount: () => [...notificationKeys.all, 'unread-count'],
};

// Get notifications
export const useNotificationsList = (options = {}) => {
  return useQuery({
    queryKey: notificationKeys.list(options),
    queryFn: () => notificationAPI.getNotifications(options),
    select: (data) => data.notifications || [],
    staleTime: 30 * 1000, // 30 seconds - notifications should be fresh
  });
};

// Get unread notification count
export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationAPI.getUnreadCount,
    select: (data) => data.count || 0,
    staleTime: 15 * 1000, // 15 seconds - count should be very fresh
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });
};

// Mark notification as read mutation
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPI.markAsRead,
    onMutate: async (notificationId) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries(notificationKeys.lists());
      await queryClient.cancelQueries(notificationKeys.unreadCount());

      // Get previous data
      const previousNotifications = queryClient.getQueryData(notificationKeys.lists());
      const previousUnreadCount = queryClient.getQueryData(notificationKeys.unreadCount());

      // Optimistically update notification lists
      queryClient.setQueriesData({ queryKey: notificationKeys.lists() }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        );
      });

      // Optimistically decrease unread count
      queryClient.setQueryData(notificationKeys.unreadCount(), (old) => Math.max(0, (old || 0) - 1));

      return { previousNotifications, previousUnreadCount };
    },
    onError: (err, notificationId, context) => {
      // Rollback optimistic updates
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.lists(), context.previousNotifications);
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount);
      }
    },
    onSettled: () => {
      // Ensure data consistency
      queryClient.invalidateQueries(notificationKeys.lists());
      queryClient.invalidateQueries(notificationKeys.unreadCount());
    },
  });
};

// Mark all notifications as read mutation
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPI.markAllAsRead,
    onMutate: async () => {
      // Cancel in-flight queries
      await queryClient.cancelQueries(notificationKeys.lists());
      await queryClient.cancelQueries(notificationKeys.unreadCount());

      // Get previous data
      const previousNotifications = queryClient.getQueryData(notificationKeys.lists());
      const previousUnreadCount = queryClient.getQueryData(notificationKeys.unreadCount());

      // Optimistically mark all notifications as read
      queryClient.setQueriesData({ queryKey: notificationKeys.lists() }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(notification => ({ ...notification, isRead: true }));
      });

      // Optimistically set unread count to 0
      queryClient.setQueryData(notificationKeys.unreadCount(), () => 0);

      return { previousNotifications, previousUnreadCount };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.lists(), context.previousNotifications);
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount);
      }
    },
    onSettled: () => {
      // Ensure data consistency
      queryClient.invalidateQueries(notificationKeys.lists());
      queryClient.invalidateQueries(notificationKeys.unreadCount());
    },
  });
};

// Delete notification mutation
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPI.deleteNotification,
    onMutate: async (notificationId) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries(notificationKeys.lists());
      await queryClient.cancelQueries(notificationKeys.unreadCount());

      // Get previous data
      const previousNotifications = queryClient.getQueryData(notificationKeys.lists());
      const previousUnreadCount = queryClient.getQueryData(notificationKeys.unreadCount());

      // Find the notification to check if it was unread
      const deletedNotification = Array.isArray(previousNotifications) 
        ? previousNotifications.find(n => n.id === notificationId)
        : null;

      // Optimistically remove notification from lists
      queryClient.setQueriesData({ queryKey: notificationKeys.lists() }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter(notification => notification.id !== notificationId);
      });

      // Optimistically update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        queryClient.setQueryData(notificationKeys.unreadCount(), (old) => Math.max(0, (old || 0) - 1));
      }

      return { previousNotifications, previousUnreadCount };
    },
    onError: (err, notificationId, context) => {
      // Rollback optimistic updates
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.lists(), context.previousNotifications);
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount);
      }
    },
    onSettled: () => {
      // Ensure data consistency
      queryClient.invalidateQueries(notificationKeys.lists());
      queryClient.invalidateQueries(notificationKeys.unreadCount());
    },
  });
};

// Custom hook for smart polling that respects tab visibility
export const useSmartPolling = (queryKey, interval = 30000) => {
  const queryClient = useQueryClient();

  return {
    startPolling: () => {
      const intervalId = setInterval(() => {
        if (!document.hidden) {
          queryClient.invalidateQueries({ queryKey });
        }
      }, interval);

      const handleVisibilityChange = () => {
        if (!document.hidden) {
          queryClient.invalidateQueries({ queryKey });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    },
  };
};
