import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionAPI } from '../utils/api';

// ================================
// Query Keys & Constants
// ================================
export const connectionKeys = {
  all: ['connections'],
  lists: () => [...connectionKeys.all, 'list'],
  pending: () => [...connectionKeys.lists(), 'pending'],
  sent: () => [...connectionKeys.lists(), 'sent'],
  connections: () => [...connectionKeys.lists(), 'connections'],
  status: (userId) => [...connectionKeys.all, 'status', userId],
  statuses: (userIds) => [...connectionKeys.all, 'statuses', userIds],
};

const STALE_TIMES = {
  PENDING: 30 * 1000,
  SENT: 60 * 1000,
  CONNECTIONS: 5 * 60 * 1000,
  STATUS: 2 * 60 * 1000,
};

// ================================
// Optimistic Update Helpers
// ================================
const createOptimisticConnectionHelpers = (queryClient) => ({
  async cancelQueries(keys = []) {
    for (const key of keys) {
      await queryClient.cancelQueries(key);
    }
  },
  getSnapshot(keys = []) {
    const snap = {};
    for (const key of keys) {
      snap[key] = queryClient.getQueryData(key);
    }
    return snap;
  },
  rollback(snapshot) {
    if (!snapshot) return;
    Object.entries(snapshot).forEach(([key, value]) => {
      if (value !== undefined) queryClient.setQueryData(key, value);
    });
  },
  invalidate(keys = []) {
    for (const key of keys) {
      queryClient.invalidateQueries(key);
    }
  },
});

// ================================
// Query Hooks
// ================================
export const usePendingRequests = () =>
  useQuery({
    queryKey: connectionKeys.pending(),
    queryFn: connectionAPI.getPendingRequests,
    select: (data) => data.requests || [],
    staleTime: STALE_TIMES.PENDING,
  });

export const useSentRequests = () =>
  useQuery({
    queryKey: connectionKeys.sent(),
    queryFn: connectionAPI.getSentRequests,
    select: (data) => data.requests || [],
    staleTime: STALE_TIMES.SENT,
  });

export const useConnectionsList = () =>
  useQuery({
    queryKey: connectionKeys.connections(),
    queryFn: connectionAPI.getUserConnections,
    select: (data) => data.connections || [],
    staleTime: STALE_TIMES.CONNECTIONS,
  });

export const useConnectionStatus = (userId, enabled = true) =>
  useQuery({
    queryKey: connectionKeys.status(userId),
    queryFn: () => connectionAPI.getConnectionStatus(userId),
    enabled: enabled && !!userId,
    staleTime: STALE_TIMES.STATUS,
    select: (data) => data.status,
  });

// ================================
// Mutation Hooks
// ================================
export const useSendConnectionRequest = () => {
  const queryClient = useQueryClient();
  const helpers = createOptimisticConnectionHelpers(queryClient);
  return useMutation({
    mutationFn: connectionAPI.sendConnectionRequest,
    onMutate: async (recipientId) => {
      await helpers.cancelQueries([
        ['users'],
        connectionKeys.status(recipientId),
      ]);
      const snapshot = {
        users: queryClient.getQueryData(['users', 'with-connection-status']),
        status: queryClient.getQueryData(connectionKeys.status(recipientId)),
      };
      // Optimistic update
      queryClient.setQueryData(connectionKeys.status(recipientId), () => ({ status: 'pending', isRequester: true }));
      if (snapshot.users) {
        queryClient.setQueryData(['users', 'with-connection-status'], (old) =>
          old?.map(user =>
            user.id === recipientId
              ? { ...user, connectionStatus: { status: 'pending', isRequester: true } }
              : user
          )
        );
      }
      return { snapshot, recipientId };
    },
    onSuccess: () => {
      helpers.invalidate([connectionKeys.sent(), ['notifications']]);
    },
    onError: (err, recipientId, context) => {
      if (context?.snapshot?.users) {
        queryClient.setQueryData(['users', 'with-connection-status'], context.snapshot.users);
      }
      if (context?.snapshot?.status) {
        queryClient.setQueryData(connectionKeys.status(context.recipientId), context.snapshot.status);
      }
    },
  });
};

export const useAcceptConnectionRequest = () => {
  const queryClient = useQueryClient();
  const helpers = createOptimisticConnectionHelpers(queryClient);
  return useMutation({
    mutationFn: connectionAPI.acceptConnectionRequest,
    onMutate: async (connectionId) => {
      await helpers.cancelQueries([connectionKeys.pending()]);
      const pending = queryClient.getQueryData(connectionKeys.pending());
      const accepted = pending?.find(req => req.id === connectionId);
      if (pending) {
        queryClient.setQueryData(connectionKeys.pending(), pending.filter(req => req.id !== connectionId));
      }
      return { snapshot: { pending }, accepted };
    },
    onSuccess: (data, connectionId, context) => {
      helpers.invalidate([connectionKeys.connections(), ['notifications']]);
      if (context?.accepted?.requesterId) {
        queryClient.setQueryData(
          connectionKeys.status(context.accepted.requesterId),
          () => ({ status: 'accepted' })
        );
      }
    },
    onError: (err, connectionId, context) => {
      if (context?.snapshot?.pending) {
        queryClient.setQueryData(connectionKeys.pending(), context.snapshot.pending);
      }
    },
  });
};

export const useRejectConnectionRequest = () => {
  const queryClient = useQueryClient();
  const helpers = createOptimisticConnectionHelpers(queryClient);
  return useMutation({
    mutationFn: connectionAPI.rejectConnectionRequest,
    onMutate: async (connectionId) => {
      await helpers.cancelQueries([connectionKeys.pending()]);
      const pending = queryClient.getQueryData(connectionKeys.pending());
      const rejected = pending?.find(req => req.id === connectionId);
      if (pending) {
        queryClient.setQueryData(connectionKeys.pending(), pending.filter(req => req.id !== connectionId));
      }
      return { snapshot: { pending }, rejected };
    },
    onSuccess: (data, connectionId, context) => {
      helpers.invalidate([['notifications']]);
      if (context?.rejected?.requesterId) {
        queryClient.setQueryData(
          connectionKeys.status(context.rejected.requesterId),
          () => ({ status: 'none' })
        );
      }
    },
    onError: (err, connectionId, context) => {
      if (context?.snapshot?.pending) {
        queryClient.setQueryData(connectionKeys.pending(), context.snapshot.pending);
      }
    },
  });
};

export const useRemoveConnection = () => {
  const queryClient = useQueryClient();
  const helpers = createOptimisticConnectionHelpers(queryClient);
  return useMutation({
    mutationFn: connectionAPI.removeConnection,
    onMutate: async (connectionId) => {
      await helpers.cancelQueries([connectionKeys.connections()]);
      const connections = queryClient.getQueryData(connectionKeys.connections());
      const removed = connections?.find(conn => conn.id === connectionId);
      if (connections) {
        queryClient.setQueryData(connectionKeys.connections(), connections.filter(conn => conn.id !== connectionId));
      }
      return { snapshot: { connections }, removed };
    },
    onSuccess: (data, connectionId, context) => {
      if (context?.removed) {
        const otherUserId = context.removed.requesterId === context.removed.currentUserId
          ? context.removed.recipientId
          : context.removed.requesterId;
        queryClient.setQueryData(
          connectionKeys.status(otherUserId),
          () => ({ status: 'none' })
        );
      }
    },
    onError: (err, connectionId, context) => {
      if (context?.snapshot?.connections) {
        queryClient.setQueryData(connectionKeys.connections(), context.snapshot.connections);
      }
    },
  });
};

// ================================
// Composite Feature Hook
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
    // Queries
    pendingRequests: pending.data || [],
    sentRequests: sent.data || [],
    connections: connections.data || [],
    isLoadingPending: pending.isLoading,
    isLoadingSent: sent.isLoading,
    isLoadingConnections: connections.isLoading,
    // Mutations
    sendRequest: sendRequest.mutate,
    acceptRequest: acceptRequest.mutate,
    rejectRequest: rejectRequest.mutate,
    removeConnection: removeConnection.mutate,
    // Mutation states
    isSending: sendRequest.isPending,
    isAccepting: acceptRequest.isPending,
    isRejecting: rejectRequest.isPending,
    isRemoving: removeConnection.isPending,
    // Refetch
    refetchPending: pending.refetch,
    refetchSent: sent.refetch,
    refetchConnections: connections.refetch,
  };
};

