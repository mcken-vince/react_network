import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionAPI } from '../utils/api';

// Query Keys
export const connectionKeys = {
  all: ['connections'],
  lists: () => [...connectionKeys.all, 'list'],
  pending: () => [...connectionKeys.lists(), 'pending'],
  sent: () => [...connectionKeys.lists(), 'sent'],
  connections: () => [...connectionKeys.lists(), 'connections'],
  status: (userId) => [...connectionKeys.all, 'status', userId],
  statuses: (userIds) => [...connectionKeys.all, 'statuses', userIds],
};

// Get pending connection requests
export const usePendingRequests = () => {
  return useQuery({
    queryKey: connectionKeys.pending(),
    queryFn: connectionAPI.getPendingRequests,
    select: (data) => data.requests || [],
    staleTime: 30 * 1000, // 30 seconds - should be fresh for incoming requests
  });
};

// Get sent connection requests
export const useSentRequests = () => {
  return useQuery({
    queryKey: connectionKeys.sent(),
    queryFn: connectionAPI.getSentRequests,
    select: (data) => data.requests || [],
    staleTime: 60 * 1000, // 1 minute
  });
};

// Get user connections
export const useConnections = () => {
  return useQuery({
    queryKey: connectionKeys.connections(),
    queryFn: connectionAPI.getUserConnections,
    select: (data) => data.connections || [],
    staleTime: 5 * 60 * 1000, // 5 minutes - connections don't change frequently
  });
};

// Get connection status with a specific user
export const useConnectionStatus = (userId, enabled = true) => {
  return useQuery({
    queryKey: connectionKeys.status(userId),
    queryFn: () => connectionAPI.getConnectionStatus(userId),
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => data.status,
  });
};

// Send connection request mutation
export const useSendConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectionAPI.sendConnectionRequest,
    onMutate: async (recipientId) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries(['users']);
      await queryClient.cancelQueries(connectionKeys.status(recipientId));

      // Snapshot previous values
      const previousUsers = queryClient.getQueryData(['users', 'with-connection-status']);
      const previousStatus = queryClient.getQueryData(connectionKeys.status(recipientId));

      // Optimistically update connection status
      queryClient.setQueryData(connectionKeys.status(recipientId), () => ({
        status: 'pending',
        isRequester: true,
      }));

      // Optimistically update users list if it exists
      if (previousUsers) {
        queryClient.setQueryData(['users', 'with-connection-status'], (old) => 
          old?.map(user => 
            user.id === recipientId
              ? { ...user, connectionStatus: { status: 'pending', isRequester: true } }
              : user
          )
        );
      }

      return { previousUsers, previousStatus, recipientId };
    },
    onSuccess: () => {
      // Invalidate relevant queries to ensure consistency
      queryClient.invalidateQueries(connectionKeys.sent());
      queryClient.invalidateQueries(['notifications']);
    },
    onError: (err, recipientId, context) => {
      // Rollback optimistic updates on error
      if (context?.previousUsers) {
        queryClient.setQueryData(['users', 'with-connection-status'], context.previousUsers);
      }
      if (context?.previousStatus) {
        queryClient.setQueryData(connectionKeys.status(context.recipientId), context.previousStatus);
      }
    },
  });
};

// Accept connection request mutation
export const useAcceptConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectionAPI.acceptConnectionRequest,
    onMutate: async (connectionId) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries(connectionKeys.pending());
      
      // Get the current pending requests
      const previousPendingRequests = queryClient.getQueryData(connectionKeys.pending());

      // Find the connection being accepted
      const acceptedConnection = previousPendingRequests?.find(req => req.id === connectionId);

      // Optimistically remove from pending requests
      if (previousPendingRequests) {
        queryClient.setQueryData(connectionKeys.pending(), 
          previousPendingRequests.filter(req => req.id !== connectionId)
        );
      }

      return { previousPendingRequests, acceptedConnection };
    },
    onSuccess: (data, connectionId, context) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries(connectionKeys.connections());
      queryClient.invalidateQueries(['notifications']);
      
      // Update connection status if we have the related user ID
      if (context?.acceptedConnection?.requesterId) {
        queryClient.setQueryData(
          connectionKeys.status(context.acceptedConnection.requesterId),
          () => ({ status: 'accepted' })
        );
      }
    },
    onError: (err, connectionId, context) => {
      // Rollback optimistic update on error
      if (context?.previousPendingRequests) {
        queryClient.setQueryData(connectionKeys.pending(), context.previousPendingRequests);
      }
    },
  });
};

// Reject connection request mutation
export const useRejectConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectionAPI.rejectConnectionRequest,
    onMutate: async (connectionId) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries(connectionKeys.pending());
      
      // Get current pending requests
      const previousPendingRequests = queryClient.getQueryData(connectionKeys.pending());

      // Find the connection being rejected
      const rejectedConnection = previousPendingRequests?.find(req => req.id === connectionId);

      // Optimistically remove from pending requests
      if (previousPendingRequests) {
        queryClient.setQueryData(connectionKeys.pending(), 
          previousPendingRequests.filter(req => req.id !== connectionId)
        );
      }

      return { previousPendingRequests, rejectedConnection };
    },
    onSuccess: (data, connectionId, context) => {
      // Invalidate notifications to show rejection notification
      queryClient.invalidateQueries(['notifications']);
      
      // Update connection status if we have the related user ID
      if (context?.rejectedConnection?.requesterId) {
        queryClient.setQueryData(
          connectionKeys.status(context.rejectedConnection.requesterId),
          () => ({ status: 'none' })
        );
      }
    },
    onError: (err, connectionId, context) => {
      // Rollback optimistic update on error
      if (context?.previousPendingRequests) {
        queryClient.setQueryData(connectionKeys.pending(), context.previousPendingRequests);
      }
    },
  });
};

// Remove connection mutation
export const useRemoveConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectionAPI.removeConnection,
    onMutate: async (connectionId) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries(connectionKeys.connections());
      
      // Get current connections
      const previousConnections = queryClient.getQueryData(connectionKeys.connections());

      // Find the connection being removed
      const removedConnection = previousConnections?.find(conn => conn.id === connectionId);

      // Optimistically remove from connections
      if (previousConnections) {
        queryClient.setQueryData(connectionKeys.connections(), 
          previousConnections.filter(conn => conn.id !== connectionId)
        );
      }

      return { previousConnections, removedConnection };
    },
    onSuccess: (data, connectionId, context) => {
      // Update connection status if we have the related user ID
      if (context?.removedConnection) {
        const otherUserId = context.removedConnection.requesterId === context.currentUserId 
          ? context.removedConnection.recipientId 
          : context.removedConnection.requesterId;
          
        queryClient.setQueryData(
          connectionKeys.status(otherUserId),
          () => ({ status: 'none' })
        );
      }
    },
    onError: (err, connectionId, context) => {
      // Rollback optimistic update on error
      if (context?.previousConnections) {
        queryClient.setQueryData(connectionKeys.connections(), context.previousConnections);
      }
    },
  });
};
