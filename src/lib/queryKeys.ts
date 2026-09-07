import type { NotificationFilters } from "../types";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  withConnectionStatus: () =>
    [...userKeys.all, "with-connection-status"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number | string) => [...userKeys.details(), Number(id)] as const,
  current: () => [...userKeys.all, "current"] as const,
};

export const connectionKeys = {
  all: ["connections"] as const,
  lists: () => [...connectionKeys.all, "list"] as const,
  pending: () => [...connectionKeys.lists(), "pending"] as const,
  sent: () => [...connectionKeys.lists(), "sent"] as const,
  accepted: () => [...connectionKeys.lists(), "accepted"] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters?: NotificationFilters) =>
    [...notificationKeys.lists(), { filters: filters ?? {} }] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export const postKeys = {
  all: ["posts"] as const,
  feed: () => [...postKeys.all, "feed"] as const,
  user: (userId: number) => [...postKeys.all, "user", userId] as const,
  detail: (postId: string) => [...postKeys.all, "detail", postId] as const,
};

export const conversationKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationKeys.all, "list"] as const,
  detail: (id: string) => [...conversationKeys.all, "detail", id] as const,
};

export const messageKeys = {
  all: ["messages"] as const,
  list: (conversationId: string) =>
    [...messageKeys.all, "list", conversationId] as const,
};
