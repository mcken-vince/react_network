import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseQueryResult,
} from "@tanstack/react-query";
import { notificationAPI } from "../lib/api";
import { notificationKeys } from "../lib/queryKeys";
import type {
  Notification,
  NotificationFilters,
  NotificationsResponse,
} from "../types";

const STALE_TIME = 30_000;
const PAGE_SIZE = 20;

type QueryClient = ReturnType<typeof useQueryClient>;
type NotificationPages = InfiniteData<NotificationsResponse>;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const useNotificationsList = (filters: NotificationFilters = {}) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: ({ pageParam }) =>
      notificationAPI.list({ ...filters, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    // `count` is the server's page size; offsets are summed from it so that
    // socket-prepended items never shift what we ask for next.
    getNextPageParam: (last, pages) =>
      last.count === PAGE_SIZE
        ? pages.reduce((sum, p) => sum + p.count, 0)
        : undefined,
    staleTime: STALE_TIME,
  });

/** Flat, de-duplicated (a socket prepend can overlap the next fetched page). */
export const flattenNotifications = (
  data: NotificationPages | undefined,
): Notification[] => {
  const seen = new Set<number>();
  const out: Notification[] = [];
  for (const n of data?.pages.flatMap((p) => p.notifications) ?? []) {
    if (!seen.has(n.id)) {
      seen.add(n.id);
      out.push(n);
    }
  }
  return out;
};

export const useUnreadNotificationCount = (): UseQueryResult<number, Error> =>
  useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationAPI.unreadCount().then((r) => r.count),
    staleTime: STALE_TIME,
  });

// ---------------------------------------------------------------------------
// Cache helpers (also used by WebSocketProvider)
// ---------------------------------------------------------------------------

/** Apply `updater` to every page of every cached notification list. */
export const patchNotificationLists = (
  queryClient: QueryClient,
  updater: (list: Notification[]) => Notification[],
): void => {
  queryClient.setQueriesData<NotificationPages>(
    { queryKey: notificationKeys.lists() },
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              notifications: updater(p.notifications),
            })),
          }
        : old,
  );
};

/** Insert (or replace) a notification at the top of every cached list. */
export const prependNotification = (
  queryClient: QueryClient,
  notification: Notification,
): void => {
  queryClient.setQueriesData<NotificationPages>(
    { queryKey: notificationKeys.lists() },
    (old) => {
      const [first, ...rest] = old?.pages ?? [];
      if (!old || !first) return old;
      const without = (list: Notification[]) =>
        list.filter((n) => n.id !== notification.id);
      return {
        ...old,
        pages: [
          {
            ...first,
            notifications: [notification, ...without(first.notifications)],
          },
          ...rest.map((p) => ({
            ...p,
            notifications: without(p.notifications),
          })),
        ],
      };
    },
  );
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) =>
      notificationAPI.markRead(notificationId),
    onMutate: (notificationId) => {
      patchNotificationLists(queryClient, (list) =>
        list.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      queryClient.setQueryData<number>(notificationKeys.unreadCount(), (c) =>
        Math.max(0, (c ?? 0) - 1),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      }),
  });
};

const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onMutate: () => {
      patchNotificationLists(queryClient, (list) =>
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
      patchNotificationLists(queryClient, (list) =>
        list.filter((n) => n.id !== notificationId),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      }),
  });
};

/** Invalidate every notification query (after connection actions, etc.). */
export const useRefreshNotifications = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
};

// ---------------------------------------------------------------------------
// Feature hook
// ---------------------------------------------------------------------------

export interface NotificationsFeature {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
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
    notifications: flattenNotifications(list.data),
    unreadCount: count.data ?? 0,
    isLoading: list.isLoading,
    isRefreshing:
      (list.isFetching && !list.isFetchingNextPage) || count.isFetching,
    hasMore: Boolean(list.hasNextPage),
    isLoadingMore: list.isFetchingNextPage,
    loadMore: () => void list.fetchNextPage(),
    refresh,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: remove.mutate,
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
    isDeleting: remove.isPending,
  };
};
