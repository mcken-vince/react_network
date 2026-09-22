import type {
  NotificationFilters,
  ReactionTargetType,
  ReactionType,
} from "../types";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  withConnectionStatus: () =>
    [...userKeys.all, "with-connection-status"] as const,
  searches: () => [...userKeys.all, "search"] as const,
  search: (term: string) => [...userKeys.searches(), term] as const,
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
  /** Every paginated post list (feed + per-user) — target for cache patches. */
  lists: () => [...postKeys.all, "list"] as const,
  feed: () => [...postKeys.lists(), "feed"] as const,
  user: (userId: number) => [...postKeys.lists(), "user", userId] as const,
  detail: (postId: string) => [...postKeys.all, "detail", postId] as const,
  comments: (postId: string) => [...postKeys.all, "comments", postId] as const,
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

/** "Who reacted" lists. Reaction *summaries* live on the posts/comments/messages themselves. */
export const reactionKeys = {
  all: ["reactions"] as const,
  /** Every reactor list for one target (all type tabs) — invalidation target. */
  target: (targetType: ReactionTargetType, targetId: string) =>
    [...reactionKeys.all, targetType, targetId] as const,
  reactors: (
    targetType: ReactionTargetType,
    targetId: string,
    type?: ReactionType,
  ) =>
    [
      ...reactionKeys.target(targetType, targetId),
      { type: type ?? null },
    ] as const,
};
