import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { connectionAPI } from "../utils/api";
import { userKeys } from "./useUsers";
import { notificationKeys } from "./useNotifications";

// ================================
// Query keys
// ================================
export const connectionKeys = {
  all: ["connections"],
  lists: () => [...connectionKeys.all, "list"],
  pending: () => [...connectionKeys.lists(), "pending"],
  sent: () => [...connectionKeys.lists(), "sent"],
  connections: () => [...connectionKeys.lists(), "connections"],
};

const STALE_TIMES = {
  PENDING: 30 * 1000,
  SENT: 60 * 1000,
  CONNECTIONS: 5 * 60 * 1000,
};

// ================================
// Cache helpers
// ================================
// The cache stores the RAW server response ({ requests: [...] } or
// { connections: [...] }); `select` only shapes what hooks return.
const invalidate = (queryClient, keys) =>
  keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

/**
 * Optimistically remove an item from a raw list response in the cache.
 * Returns the previous cache value for rollback.
 */
const removeFromCachedList = (queryClient, queryKey, field, id) => {
  const previous = queryClient.getQueryData(queryKey);
  if (Array.isArray(previous?.[field])) {
    queryClient.setQueryData(queryKey, {
      ...previous,
      [field]: previous[field].filter((item) => item.id !== id),
    });
  }
  return previous;
};

const restore = (queryClient, queryKey, previous) => {
  if (previous !== undefined) queryClient.setQueryData(queryKey, previous);
};

// ================================
// Query hooks
// ================================
export const usePendingRequests = () =>
  useQuery({
    queryKey: connectionKeys.pending(),
    queryFn: connectionAPI.getPendingRequests,
    select: (data) => data?.requests ?? [],
    staleTime: STALE_TIMES.PENDING,
  });

export const useSentRequests = () =>
  useQuery({
    queryKey: connectionKeys.sent(),
    queryFn: connectionAPI.getSentRequests,
    select: (data) => data?.requests ?? [],
    staleTime: STALE_TIMES.SENT,
  });

export const useConnectionsList = () =>
  useQuery({
    queryKey: connectionKeys.connections(),
    queryFn: connectionAPI.getUserConnections,
    select: (data) => data?.connections ?? [],
    staleTime: STALE_TIMES.CONNECTIONS,
  });

// ================================
// Mutation hooks
// ================================
export const useSendConnectionRequest = () => {
  const queryClient = useQueryClient();
  const statusKey = userKeys.withConnectionStatus();

  return useMutation({
    mutationFn: connectionAPI.sendConnectionRequest,

    onMutate: async (recipientId) => {
      await queryClient.cancelQueries({ queryKey: statusKey });
      // This query's queryFn already unwraps to a plain array of users.
      const previous = queryClient.getQueryData(statusKey);
      if (Array.isArray(previous)) {
        queryClient.setQueryData(
          statusKey,
          previous.map((u) =>
            u.id === recipientId
              ? { ...u, connectionStatus: { status: "pending", isRequester: true } }
              : u
          )
        );
      }
      return { previous };
    },

    onError: (_err, _recipientId, context) =>
      restore(queryClient, statusKey, context?.previous),

    onSettled: () =>
      invalidate(queryClient, [connectionKeys.sent(), statusKey, notificationKeys.all]),
  });
};

export const useAcceptConnectionRequest = () => {
  const queryClient = useQueryClient();
  const pendingKey = connectionKeys.pending();

  return useMutation({
    mutationFn: connectionAPI.acceptConnectionRequest,

    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: pendingKey });
      const previous = removeFromCachedList(queryClient, pendingKey, "requests", connectionId);
      return { previous };
    },

    onError: (_err, _id, context) => restore(queryClient, pendingKey, context?.previous),

    onSettled: () =>
      invalidate(queryClient, [
        pendingKey,
        connectionKeys.connections(),
        userKeys.withConnectionStatus(),
        notificationKeys.all,
      ]),
  });
};

export const useRejectConnectionRequest = () => {
  const queryClient = useQueryClient();
  const pendingKey = connectionKeys.pending();

  return useMutation({
    mutationFn: connectionAPI.rejectConnectionRequest,

    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: pendingKey });
      const previous = removeFromCachedList(queryClient, pendingKey, "requests", connectionId);
      return { previous };
    },

    onError: (_err, _id, context) => restore(queryClient, pendingKey, context?.previous),

    onSettled: () =>
      invalidate(queryClient, [
        pendingKey,
        userKeys.withConnectionStatus(),
        notificationKeys.all,
      ]),
  });
};

/**
 * Removes an accepted connection OR cancels a sent request (same endpoint).
 * Optimistically updates both lists; only the one containing the id changes.
 */
export const useRemoveConnection = () => {
  const queryClient = useQueryClient();
  const connectionsKey = connectionKeys.connections();
  const sentKey = connectionKeys.sent();

  return useMutation({
    mutationFn: connectionAPI.removeConnection,

    onMutate: async (connectionId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: connectionsKey }),
        queryClient.cancelQueries({ queryKey: sentKey }),
      ]);
      const previousConnections = removeFromCachedList(
        queryClient, connectionsKey, "connections", connectionId
      );
      const previousSent = removeFromCachedList(queryClient, sentKey, "requests", connectionId);
      return { previousConnections, previousSent };
    },

    onError: (_err, _id, context) => {
      restore(queryClient, connectionsKey, context?.previousConnections);
      restore(queryClient, sentKey, context?.previousSent);
    },

    onSettled: () =>
      invalidate(queryClient, [connectionsKey, sentKey, userKeys.withConnectionStatus()]),
  });
};

// ================================
// Composite hook
// ================================
export const useConnectionsFeature = () => {
  const pending = usePendingRequests();
  const sent = useSentRequests();
  const connections = useConnectionsList();

  const sendRequest = useSendConnectionRequest();
  const acceptRequest = useAcceptConnectionRequest();
  const rejectRequest = useRejectConnectionRequest();
  const removeConnection = useRemoveConnection();

  return {
    pendingRequests: pending.data ?? [],
    sentRequests: sent.data ?? [],
    connections: connections.data ?? [],
    isLoadingPending: pending.isLoading,
    isLoadingSent: sent.isLoading,
    isLoadingConnections: connections.isLoading,

    sendRequest: sendRequest.mutate,
    acceptRequest: acceptRequest.mutate,
    rejectRequest: rejectRequest.mutate,
    removeConnection: removeConnection.mutate,

    isSending: sendRequest.isPending,
    isAccepting: acceptRequest.isPending,
    isRejecting: rejectRequest.isPending,
    isRemoving: removeConnection.isPending,

    refetchPending: pending.refetch,
    refetchSent: sent.refetch,
    refetchConnections: connections.refetch,
  };
};