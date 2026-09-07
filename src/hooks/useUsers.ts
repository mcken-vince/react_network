import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userAPI } from "../lib/api";
import { userKeys } from "../lib/queryKeys";
import type {
  ProfileUpdateData,
  UserResponse,
  UserWithConnectionStatus,
} from "../types";

export { userKeys };

const STALE = { user: 10 * 60_000, list: 5 * 60_000, status: 2 * 60_000 };

export const useCurrentUser = () =>
  useQuery({
    queryKey: userKeys.current(),
    queryFn: userAPI.getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: STALE.user,
  });

export const useUsers = () =>
  useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => userAPI.getAllUsers(),
    select: (data) => data.users,
    staleTime: STALE.list,
  });

export const useUsersWithConnectionStatus = (enabled = true) =>
  useQuery({
    queryKey: userKeys.withConnectionStatus(),
    queryFn: () => userAPI.getAllUsersWithConnectionStatus(),
    select: (data) => data.users,
    enabled,
    staleTime: STALE.status,
  });

export const useUser = (userId: number | string, enabled = true) =>
  useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userAPI.getUser(Number(userId)),
    enabled: enabled && Number.isFinite(Number(userId)),
    staleTime: STALE.user,
  });

export const useUserWithConnectionStatus = (
  userId: number | string,
  enabled = true,
): { data: UserWithConnectionStatus | undefined; isLoading: boolean } => {
  const { data = [], isLoading } = useUsersWithConnectionStatus(enabled);
  const numericId = Number(userId);
  return { data: data.find((u) => u.id === numericId), isLoading };
};

export const usePrefetchUser = () => {
  const queryClient = useQueryClient();
  return (userId: number | string): void => {
    if (!Number.isFinite(Number(userId))) return;
    void queryClient.prefetchQuery({
      queryKey: userKeys.detail(userId),
      queryFn: () => userAPI.getUser(Number(userId)),
      staleTime: STALE.user,
    });
  };
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: number; data: ProfileUpdateData }) =>
      userAPI.updateProfile(vars.userId, vars.data),
    onSuccess: (res, vars) => {
      queryClient.setQueryData(userKeys.detail(vars.userId), res);
      queryClient.setQueryData<UserResponse | undefined>(
        userKeys.current(),
        (old) =>
          old && old.user.id === vars.userId ? { ...old, user: res.user } : old,
      );
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: userKeys.withConnectionStatus(),
      });
    },
  });
};
