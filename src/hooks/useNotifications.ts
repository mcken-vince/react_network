import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { notificationAPI } from "../lib/api";
import { notificationKeys } from "../lib/queryKeys";
import type { Notification, NotificationFilters } from "../types";

const STALE_TIME = 30_000;

const useNotificationsList = (
  filters: NotificationFilters = {},
): UseQueryResult<Notification[], Error> =>
  useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationAPI.list(filters).then((r) => r.notifications),
    staleTime: STALE_TIME,
  });

export const useUnreadNotificationCount = (): UseQueryResult<number, Error> =>
  useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationAPI.unreadCount().then((r) => r.count),
    staleTime: STALE_TIME,
  });

type QueryClient = ReturnType<typeof useQueryClient>;

const patchLists = (
  queryClient: QueryClient,
  updater: (list: Notification[]) => Notification[],
): void => {
  queryClient.setQueriesData<Notification[]>(
    { queryKey: notificationKeys.lists() },
    (old) => (old ? updater(old) : old),
  );
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) =>
      notificationAPI.markRead(notificationId),
    onMutate: (notificationId) => {
      patchLists(queryClient, (list) =>
        list.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      queryClient.setQueryData<number>(notificationKeys.unreadCount(), (c) =>
        Math.max(0, (c ?? 0) - 1),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};

const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onMutate: () => {
      patchLists(queryClient, (list) =>
        list.map((n) => ({ ...n, isRead: true })),
      );
      queryClient.setQueryData<number>(notificationKeys.unreadCount(), 0);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) =>
      notificationAPI.remove(notificationId),
    onMutate: (notificationId) =>
      patchLists(queryClient, (list) =>
        list.filter((n) => n.id !== notificationId),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};

/** Invalidate every notification query (after connection actions, etc.). */
export const useRefreshNotifications = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
};

export interface NotificationsFeature {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  isMarkingAsRead: boolean;
  isMarkingAllAsRead: boolean;
  isDeleting: boolean;
}

export const useNotificationsFeature = (
  filters: NotificationFilters = {},
): NotificationsFeature => {
  const list = useNotificationsList(filters);
  const count = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const remove = useDeleteNotification();
  const refresh = useRefreshNotifications();

  return {
    notifications: list.data ?? [],
    unreadCount: count.data ?? 0,
    isLoading: list.isLoading,
    isRefreshing: list.isFetching || count.isFetching,
    refresh,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: remove.mutate,
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
    isDeleting: remove.isPending,
  };
};
