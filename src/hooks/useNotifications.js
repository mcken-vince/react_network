import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../utils/api';

// ================================
// Query Keys Configuration
// ================================
export const notificationKeys = {
  all: ['notifications'],
  lists: () => [...notificationKeys.all, 'list'],
  list: (filters) => [...notificationKeys.lists(), { filters }],
  unreadCount: () => [...notificationKeys.all, 'unread-count'],
};

// ================================
// Constants
// ================================
const POLLING_INTERVALS = {
  NOTIFICATIONS: 30 * 1000,    // 30 seconds
  UNREAD_COUNT: 30 * 1000,      // 30 seconds
};

const STALE_TIMES = {
  NOTIFICATIONS: 30 * 1000,     // 30 seconds
  UNREAD_COUNT: 15 * 1000,      // 15 seconds
};

// ================================
// Query Hooks
// ================================

/**
 * Hook to fetch notifications list
 * @param {Object} options - Query options (limit, offset, unreadOnly)
 * @returns {UseQueryResult} React Query result
 */
export const useNotificationsList = (options = {}) => {
  return useQuery({
    queryKey: notificationKeys.list(options),
    queryFn: () => notificationAPI.getNotifications(options),
    select: (data) => data.notifications || [],
    staleTime: STALE_TIMES.NOTIFICATIONS,
  });
};

/**
 * Hook to fetch unread notification count
 * @returns {UseQueryResult} React Query result with count
 */
export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationAPI.getUnreadCount,
    select: (data) => data.count || 0,
    staleTime: STALE_TIMES.UNREAD_COUNT,
    refetchInterval: POLLING_INTERVALS.UNREAD_COUNT,
    refetchIntervalInBackground: false,
  });
};

// ================================
// Mutation Helpers
// ================================

/**
 * Helper to handle optimistic updates for notification mutations
 * @param {QueryClient} queryClient - React Query client
 * @returns {Object} Helper functions
 */
const createOptimisticUpdateHelpers = (queryClient) => ({
  async cancelQueries() {
    await queryClient.cancelQueries(notificationKeys.lists());
    await queryClient.cancelQueries(notificationKeys.unreadCount());
  },

  getSnapshot() {
    return {
      notifications: queryClient.getQueryData(notificationKeys.lists()),
      unreadCount: queryClient.getQueryData(notificationKeys.unreadCount())
    };
  },

  rollback(snapshot) {
    if (snapshot?.notifications) {
      queryClient.setQueryData(notificationKeys.lists(), snapshot.notifications);
    }
    if (snapshot?.unreadCount !== undefined) {
      queryClient.setQueryData(notificationKeys.unreadCount(), snapshot.unreadCount);
    }
  },

  invalidateAll() {
    queryClient.invalidateQueries(notificationKeys.lists());
    queryClient.invalidateQueries(notificationKeys.unreadCount());
  },

  updateNotificationInLists(updateFn) {
    queryClient.setQueriesData({ queryKey: notificationKeys.lists() }, (oldData) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;
      return updateFn(oldData);
    });
  },

  setUnreadCount(newCount) {
    queryClient.setQueryData(notificationKeys.unreadCount(), newCount);
  },

  decrementUnreadCount() {
    queryClient.setQueryData(notificationKeys.unreadCount(), (old) => Math.max(0, (old || 0) - 1));
  }
});

// ================================
// Mutation Hooks
// ================================

/**
 * Hook to mark a single notification as read
 * @returns {UseMutationResult} Mutation hook
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const helpers = createOptimisticUpdateHelpers(queryClient);

  return useMutation({
    mutationFn: notificationAPI.markAsRead,
    
    onMutate: async (notificationId) => {
      await helpers.cancelQueries();
      const snapshot = helpers.getSnapshot();

      // Optimistic updates
      helpers.updateNotificationInLists((notifications) =>
        notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      helpers.decrementUnreadCount();

      return snapshot;
    },
    
    onError: (err, notificationId, snapshot) => {
      helpers.rollback(snapshot);
    },
    
    onSettled: () => {
      helpers.invalidateAll();
    },
  });
};

/**
 * Hook to mark all notifications as read
 * @returns {UseMutationResult} Mutation hook
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const helpers = createOptimisticUpdateHelpers(queryClient);

  return useMutation({
    mutationFn: notificationAPI.markAllAsRead,
    
    onMutate: async () => {
      await helpers.cancelQueries();
      const snapshot = helpers.getSnapshot();

      // Optimistic updates
      helpers.updateNotificationInLists((notifications) =>
        notifications.map(notification => ({ ...notification, isRead: true }))
      );
      helpers.setUnreadCount(0);

      return snapshot;
    },
    
    onError: (err, variables, snapshot) => {
      helpers.rollback(snapshot);
    },
    
    onSettled: () => {
      helpers.invalidateAll();
    },
  });
};

/**
 * Hook to delete a notification
 * @returns {UseMutationResult} Mutation hook
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const helpers = createOptimisticUpdateHelpers(queryClient);

  return useMutation({
    mutationFn: notificationAPI.deleteNotification,
    
    onMutate: async (notificationId) => {
      await helpers.cancelQueries();
      const snapshot = helpers.getSnapshot();

      // Check if notification was unread
      const notifications = snapshot.notifications;
      const deletedNotification = Array.isArray(notifications) 
        ? notifications.find(n => n.id === notificationId)
        : null;
      const wasUnread = deletedNotification && !deletedNotification.isRead;

      // Optimistic updates
      helpers.updateNotificationInLists((notifications) =>
        notifications.filter(notification => notification.id !== notificationId)
      );
      
      if (wasUnread) {
        helpers.decrementUnreadCount();
      }

      return snapshot;
    },
    
    onError: (err, notificationId, snapshot) => {
      helpers.rollback(snapshot);
    },
    
    onSettled: () => {
      helpers.invalidateAll();
    },
  });
};

// ================================
// Utility Hooks
// ================================

/**
 * Hook for intelligent polling that respects document visibility
 * @param {string} queryKey - Query key to invalidate
 * @param {number} interval - Polling interval in milliseconds
 * @returns {Object} Polling control methods
 */
export const useSmartPolling = (queryKey, interval = POLLING_INTERVALS.NOTIFICATIONS) => {
  const queryClient = useQueryClient();

  const startPolling = () => {
    let intervalId;
    
    const refreshIfVisible = () => {
      if (!document.hidden) {
        queryClient.invalidateQueries({ queryKey });
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshIfVisible();
      }
    };

    // Set up polling
    intervalId = setInterval(refreshIfVisible, interval);
    
    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  };

  return { startPolling };
};

// ================================
// Composite Hooks
// ================================

/**
 * Combined hook for common notification operations
 * @param {Object} options - Options for notifications list query
 * @returns {Object} All notification-related query and mutation hooks
 */
export const useNotificationsFeature = (options = {}) => {
  const notifications = useNotificationsList(options);
  const unreadCount = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  return {
    // Queries
    notifications: notifications.data || [],
    isLoadingNotifications: notifications.isLoading,
    notificationsError: notifications.error,
    
    unreadCount: unreadCount.data || 0,
    isLoadingUnreadCount: unreadCount.isLoading,
    
    // Mutations
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    
    // Loading states
    isMarkingAsRead: markAsRead.isLoading,
    isMarkingAllAsRead: markAllAsRead.isLoading,
    isDeleting: deleteNotification.isLoading,
    
    // Refetch functions
    refetchNotifications: notifications.refetch,
    refetchUnreadCount: unreadCount.refetch,
  };
};
