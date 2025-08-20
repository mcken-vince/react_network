import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../utils/api';

// ================================
// Query Keys Configuration
// ================================
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), { filters }],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
  current: () => [...userKeys.all, 'current'],
  withConnectionStatus: () => [...userKeys.all, 'with-connection-status'],
};

// ================================
// Constants
// ================================
const STALE_TIMES = {
  USER: 10 * 60 * 1000, // 10 minutes
  USERS: 5 * 60 * 1000, // 5 minutes
  CONNECTION_STATUS: 2 * 60 * 1000, // 2 minutes
};

// ================================
// Query Hooks
// ================================

/**
 * Get the current user
 * @returns {QueryResult<User>} 
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: userAPI.getCurrentUser,
    retry: false, // Don't retry auth failures
    refetchOnWindowFocus: false,
    staleTime: STALE_TIMES.USER
  });
};

/**
 * Get all users
 * @returns {QueryResult<User[]>}
 */
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: userAPI.getAllUsers,
    staleTime: STALE_TIMES.USERS,
    select: (data) => data.users || [],
  });
};


/**
 * Get users with connection status (for search)
 * @param {*} enabled - Whether the query is enabled
 * @returns {QueryResult<User[]>}
 */
export const useUsersWithConnectionStatus = (enabled = true) => {
  return useQuery({
    queryKey: userKeys.withConnectionStatus(),
    queryFn: async () => {
      const response = await userAPI.getAllUsersWithConnectionStatus();
      return response.users || [];
    },
    enabled,
    staleTime: STALE_TIMES.CONNECTION_STATUS,
  });
};

/**
 * Get a single user
 * @param {*} userId - The ID of the user
 * @param {*} enabled - Whether the query is enabled
 * @returns {QueryResult<User>}
 */
export const useUser = (userId, enabled = true) => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userAPI.getUser(userId),
    enabled: enabled && !!userId,
    staleTime: STALE_TIMES.USER,
  });
};

/**
 * Get a single user with connection status
 * @param {*} userId - The ID of the user
 * @param {*} enabled - Whether the query is enabled
 * @returns {QueryResult<User>}
 */
export const useUserWithConnectionStatus = (userId, enabled = true) => {
  const { data: usersWithStatus = [] } = useUsersWithConnectionStatus(enabled);
  
  return {
    data: usersWithStatus.find(user => user.id === parseInt(userId)),
    isLoading: false, // Since this depends on the users list, use that loading state
  };
};

/**
 * Update user profile mutation
 * @returns {MutationResult}
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updateData }) => userAPI.updateProfile(userId, updateData),
    onSuccess: (data, variables) => {
      // Update the user detail cache
      queryClient.setQueryData(userKeys.detail(variables.userId), data);
      
      // Update current user if it's the same user
      queryClient.setQueryData(userKeys.current(), (old) => {
        if (old?.user?.id === variables.userId) {
          return { ...old, user: data.user };
        }
        return old;
      });

      // Invalidate user lists to reflect changes
      queryClient.invalidateQueries(userKeys.lists());
    },
  });
};

/**
 * Prefetch user data
 * @returns {void}
 */
export const usePrefetchUser = () => {
  const queryClient = useQueryClient();

  return (userId) => {
    if (!userId) return;
    
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(userId),
      queryFn: () => userAPI.getUser(userId),
      staleTime: STALE_TIMES.USER,
    });
  };
};
