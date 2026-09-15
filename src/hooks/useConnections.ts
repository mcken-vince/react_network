import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connectionAPI } from "../lib/api";
import { connectionKeys, notificationKeys, userKeys } from "../lib/queryKeys";
import type {
  Connection,
  ConnectionRequestsResponse,
  ConnectionsListResponse,
  ConnectionStatusInfo,
  UsersWithConnectionStatusResponse,
} from "../types";

const STALE = { pending: 30_000, sent: 60_000, accepted: 5 * 60_000 };

type QueryClient = ReturnType<typeof useQueryClient>;

export const usePendingRequests = () =>
  useQuery({
    queryKey: connectionKeys.pending(),
    queryFn: connectionAPI.getPending,
    select: (d: ConnectionRequestsResponse) => d.requests,
    staleTime: STALE.pending,
  });

export const useSentRequests = () =>
  useQuery({
    queryKey: connectionKeys.sent(),
    queryFn: connectionAPI.getSent,
    select: (d: ConnectionRequestsResponse) => d.requests,
    staleTime: STALE.sent,
  });

export const useConnectionsList = () =>
  useQuery({
    queryKey: connectionKeys.accepted(),
    queryFn: connectionAPI.getConnections,
    select: (d: ConnectionsListResponse) => d.connections,
    staleTime: STALE.accepted,
  });

const invalidate = (
  queryClient: QueryClient,
  keys: readonly (readonly unknown[])[],
): void =>
  keys.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }));

const removeFromRequests = (
  queryClient: QueryClient,
  key: readonly unknown[],
  connectionId: number,
): ConnectionRequestsResponse | undefined => {
  const prev = queryClient.getQueryData<ConnectionRequestsResponse>(key);
  if (prev) {
    queryClient.setQueryData<ConnectionRequestsResponse>(key, {
      requests: prev.requests.filter((c) => c.id !== connectionId),
    });
  }
  return prev;
};

export const useSendConnectionRequest = () => {
  const queryClient = useQueryClient();
  const statusKey = userKeys.withConnectionStatus();
  return useMutation({
    mutationFn: (recipientId: number) => connectionAPI.sendRequest(recipientId),
    onMutate: async (recipientId) => {
      await queryClient.cancelQueries({ queryKey: statusKey });
      const previous =
        queryClient.getQueryData<UsersWithConnectionStatusResponse>(statusKey);
      if (previous) {
        const optimistic: ConnectionStatusInfo = {
          ...({} as Connection),
          status: "pending",
          isRequester: true,
        };
        queryClient.setQueryData<UsersWithConnectionStatusResponse>(statusKey, {
          users: previous.users.map((u) =>
            u.id === recipientId ? { ...u, connectionStatus: optimistic } : u,
          ),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(statusKey, ctx.previous);
    },
    onSettled: () =>
      invalidate(queryClient, [
        connectionKeys.sent(),
        statusKey,
        notificationKeys.all,
      ]),
  });
};

export const useAcceptConnectionRequest = () => {
  const queryClient = useQueryClient();
  const key = connectionKeys.pending();
  return useMutation({
    mutationFn: (connectionId: number) => connectionAPI.accept(connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: key });
      return { previous: removeFromRequests(queryClient, key, connectionId) };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    },
    onSettled: () =>
      invalidate(queryClient, [
        key,
        connectionKeys.accepted(),
        userKeys.withConnectionStatus(),
        notificationKeys.all,
      ]),
  });
};

export const useRejectConnectionRequest = () => {
  const queryClient = useQueryClient();
  const key = connectionKeys.pending();
  return useMutation({
    mutationFn: (connectionId: number) => connectionAPI.reject(connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: key });
      return { previous: removeFromRequests(queryClient, key, connectionId) };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    },
    onSettled: () =>
      invalidate(queryClient, [
        key,
        userKeys.withConnectionStatus(),
        notificationKeys.all,
      ]),
  });
};

export const useRemoveConnection = () => {
  const queryClient = useQueryClient();
  const acceptedKey = connectionKeys.accepted();
  const sentKey = connectionKeys.sent();
  return useMutation({
    mutationFn: (connectionId: number) => connectionAPI.remove(connectionId),
    onMutate: async (connectionId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: acceptedKey }),
        queryClient.cancelQueries({ queryKey: sentKey }),
      ]);
      const prevAccepted =
        queryClient.getQueryData<ConnectionsListResponse>(acceptedKey);
      if (prevAccepted) {
        queryClient.setQueryData<ConnectionsListResponse>(acceptedKey, {
          connections: prevAccepted.connections.filter(
            (c) => c.id !== connectionId,
          ),
        });
      }
      const prevSent = removeFromRequests(queryClient, sentKey, connectionId);
      return { prevAccepted, prevSent };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevAccepted)
        queryClient.setQueryData(acceptedKey, ctx.prevAccepted);
      if (ctx?.prevSent) queryClient.setQueryData(sentKey, ctx.prevSent);
    },
    onSettled: () =>
      invalidate(queryClient, [
        acceptedKey,
        sentKey,
        userKeys.withConnectionStatus(),
      ]),
  });
};
