import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { notificationAPI } from '../utils/api';
import type { Notification, NotificationFilters } from '../types';

// ================================
// Query Keys Configuration
// ================================
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters?: NotificationFilters) => [...notificationKeys.lists(), { filters }] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

// ================================
// Constants
// ================================
const STALE_TIMES = {
  NOTIFICATIONS: 30 * 1000,     // 30 seconds
  UNREAD_COUNT: 15 * 1000,      // 15 seconds
};

// ================================
// Types
// ================================
interface NotificationsResponse {
  notifications: Notification[];
}

interface UnreadCountResponse {
  count: number;
}

interface OptimisticSnapshot {
  notifications?: Notification[];
  unreadCount?: number;
}

// ================================
// Query Hooks
// ================================

/**
 * Hook to fetch notifications list
 * Note: Polling has been removed. Use manual refresh instead.
 */
export const useNotificationsList = (
  options: NotificationFilters = {}
): UseQueryResult<Notification[], Error> => {
  return useQuery({
    queryKey: notificationKeys.list(options),
    queryFn: () => notificationAPI.getNotifications(options),
    select: (data: NotificationsResponse) => data.notifications || [],
    staleTime: STALE_TIMES.NOTIFICATIONS,
    // Polling removed - manual refresh only
  });
};

/**
 * Hook to fetch unread notification count
 * Note: Polling has been removed. Use manual refresh instead.
 */
export const useUnreadNotificationCount = (): UseQueryResult<number, Error> => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationAPI.getUnreadCount,
    select: (data: UnreadCountResponse) => data.count || 0,
    staleTime: STALE_TIMES.UNREAD_COUNT,
    // Polling removed - manual refresh only
  });
};

// ================================
// Mutation Helpers
// ================================

/**
 * Helper to handle optimistic updates for notification mutations
 */
const createOptimisticUpdateHelpers = (queryClient: ReturnType<typeof useQueryClient>) => ({
  async cancelQueries(): Promise<void> {
    await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
    await queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount() });
  },

  getSnapshot(): OptimisticSnapshot {
    return {
      notifications: queryClient.getQueryData(notificationKeys.lists()),
      unreadCount: queryClient.getQueryData(notificationKeys.unreadCount())
    };
  },

  rollback(snapshot: OptimisticSnapshot): void {
    if (snapshot?.notifications) {
      queryClient.setQueryData(notificationKeys.lists(), snapshot.notifications);
    }
    if (snapshot?.unreadCount !== undefined) {
      queryClient.setQueryData(notificationKeys.unreadCount(), snapshot.unreadCount);
    }
  },

  invalidateAll(): void {
    queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
  },

  updateNotificationInLists(updateFn: (notifications: Notification[]) => Notification[]): void {
    queryClient.setQueriesData<Notification[]>(
      { queryKey: notificationKeys.lists() },
      (oldData) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return updateFn(oldData);
      }
    );
  },

  setUnreadCount(newCount: number): void {
    queryClient.setQueryData(notificationKeys.unreadCount(), newCount);
  },

  decrementUnreadCount(): void {
    queryClient.setQueryData<number>(
      notificationKeys.unreadCount(),
      (old) => Math.max(0, (old || 0) - 1)
    );
  }
});

// ================================
// Mutation Hooks
// ================================

/**
 * Hook to mark a single notification as read
 */
export const useMarkNotificationAsRead = (): UseMutationResult<
  void,
  Error,
  string,
  OptimisticSnapshot
> => {
  const queryClient = useQueryClient();
  const helpers = createOptimisticUpdateHelpers(queryClient);

  return useMutation({
    mutationFn: notificationAPI.markAsRead,
    
    onMutate: async (notificationId: string) => {
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
    
    onError: (_err, _notificationId, snapshot) => {
      if (snapshot) {
        helpers.rollback(snapshot);
      }
    },
    
    onSettled: () => {
      helpers.invalidateAll();
    },
  });
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllNotificationsAsRead = (): UseMutationResult<
  void,
  Error,
  void,
  OptimisticSnapshot
> => {
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
    
    onError: (_err, _variables, snapshot) => {
      if (snapshot) {
        helpers.rollback(snapshot);
      }
    },
    
    onSettled: () => {
      helpers.invalidateAll();
    },
  });
};

/**
 * Hook to delete a notification
 */
export const useDeleteNotification = (): UseMutationResult<
  void,
  Error,
  string,
  OptimisticSnapshot
> => {
  const queryClient = useQueryClient();
  const helpers = createOptimisticUpdateHelpers(queryClient);

  return useMutation({
    mutationFn: notificationAPI.deleteNotification,
    
    onMutate: async (notificationId: string) => {
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
    
    onError: (_err, _notificationId, snapshot) => {
      if (snapshot) {
        helpers.rollback(snapshot);
      }
    },
    
    onSettled: () => {
      helpers.invalidateAll();
    },
  });
};

// ================================
// Composite Hooks
// ================================

interface UseNotificationsFeatureResult {
  // Queries
  notifications: Notification[];
  isLoadingNotifications: boolean;
  notificationsError: Error | null;
  unreadCount: number;
  isLoadingUnreadCount: boolean;
  
  // Mutations
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  
  // Loading states
  isMarkingAsRead: boolean;
  isMarkingAllAsRead: boolean;
  isDeleting: boolean;
  
  // Refetch functions
  refetchNotifications: () => void;
  refetchUnreadCount: () => void;
}

/**
 * Combined hook for common notification operations
 */
export const useNotificationsFeature = (
  options: NotificationFilters = {}
): UseNotificationsFeatureResult => {
  const notifications = useNotificationsList(options);
  const unreadCount = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();

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
    deleteNotification: deleteNotificationMutation.mutate,
    
    // Loading states
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    
    // Refetch functions
    refetchNotifications: () => { notifications.refetch(); },
    refetchUnreadCount: () => { unreadCount.refetch(); },
  };
};
