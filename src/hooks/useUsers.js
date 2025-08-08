import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../utils/api';

// Query Keys
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), { filters }],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
  current: () => [...userKeys.all, 'current'],
  withConnectionStatus: () => [...userKeys.all, 'with-connection-status'],
};

// Get current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: userAPI.getCurrentUser,
    retry: false, // Don't retry auth failures
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes - user data doesn't change often
  });
};

// Get all users
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: userAPI.getAllUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.users || [],
  });
};

// Get users with connection status (for search)
export const useUsersWithConnectionStatus = (enabled = true) => {
  return useQuery({
    queryKey: userKeys.withConnectionStatus(),
    queryFn: async () => {
      const response = await userAPI.getAllUsersWithConnectionStatus();
      return response.users || [];
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - connection status changes more frequently
  });
};

// Get single user
export const useUser = (userId, enabled = true) => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userAPI.getUser(userId),
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Update user profile mutation
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

// Prefetch user data
export const usePrefetchUser = () => {
  const queryClient = useQueryClient();

  return (userId) => {
    if (!userId) return;
    
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(userId),
      queryFn: () => userAPI.getUser(userId),
      staleTime: 10 * 60 * 1000,
    });
  };
};
