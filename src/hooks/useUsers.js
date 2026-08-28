import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userAPI } from "../utils/api";

// ================================
// Query keys
// ================================
export const userKeys = {
  all: ["users"],
  lists: () => [...userKeys.all, "list"],
  list: (filters) => [...userKeys.lists(), { filters }],
  details: () => [...userKeys.all, "detail"],
  // Route params arrive as strings; API objects carry numbers. Normalize so
  // both address the same cache entry.
  detail: (id) => [...userKeys.details(), Number(id)],
  current: () => [...userKeys.all, "current"],
  withConnectionStatus: () => [...userKeys.all, "with-connection-status"],
};

const STALE_TIMES = {
  USER: 10 * 60 * 1000,
  USERS: 5 * 60 * 1000,
  CONNECTION_STATUS: 2 * 60 * 1000,
};

// ================================
// Query hooks
// ================================
export const useCurrentUser = () =>
  useQuery({
    queryKey: userKeys.current(),
    queryFn: userAPI.getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: STALE_TIMES.USER,
  });

export const useUsers = () =>
  useQuery({
    queryKey: userKeys.lists(),
    queryFn: userAPI.getAllUsers,
    staleTime: STALE_TIMES.USERS,
    select: (data) => data?.users ?? [],
  });

export const useUsersWithConnectionStatus = (enabled = true) =>
  useQuery({
    queryKey: userKeys.withConnectionStatus(),
    queryFn: async () => {
      const response = await userAPI.getAllUsersWithConnectionStatus();
      return response?.users ?? [];
    },
    enabled,
    staleTime: STALE_TIMES.CONNECTION_STATUS,
  });

export const useUser = (userId, enabled = true) =>
  useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userAPI.getUser(userId),
    enabled: enabled && Number.isFinite(Number(userId)),
    staleTime: STALE_TIMES.USER,
  });

export const useUserWithConnectionStatus = (userId, enabled = true) => {
  const { data: usersWithStatus = [], isLoading } =
    useUsersWithConnectionStatus(enabled);
  const numericId = Number(userId);

  return {
    data: usersWithStatus.find((user) => user.id === numericId),
    isLoading,
  };
};

// ================================
// Mutations
// ================================
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updateData }) => userAPI.updateProfile(userId, updateData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(userKeys.detail(variables.userId), data);
      queryClient.setQueryData(userKeys.current(), (old) =>
        old?.user?.id === Number(variables.userId) ? { ...old, user: data.user } : old
      );
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.withConnectionStatus() });
    },
  });
};

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