import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, authAPI } from "../lib/api";
import { useCurrentUser, useUpdateProfile } from "../hooks/useUsers";
import { userKeys } from "../lib/queryKeys";
import {
  AuthContext,
  type AuthContextValue,
  type AuthResult,
  type SignupInput,
} from "./AuthContext";
import type {
  AuthResponse,
  LoginCredentials,
  ProfileUpdateData,
  SignupData,
  UserResponse,
} from "../types";

const toFailure = (error: unknown): AuthResult =>
  error instanceof ApiError
    ? { success: false, message: error.message, errors: error.errors }
    : { success: false, message: "Something went wrong" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading, refetch } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const user = data?.user ?? null;

  const afterAuth = (res: AuthResponse): void => {
    queryClient.setQueryData<UserResponse>(userKeys.current(), {
      user: res.user,
    });
    void navigate({ to: "/dashboard" });
  };

  /** Run an auth action, translating failures into an AuthResult. */
  const attempt = async (action: () => Promise<void>): Promise<AuthResult> => {
    setError(null);
    try {
      await action();
      return { success: true };
    } catch (err) {
      const failure = toFailure(err);
      setError(failure.message ?? null);
      return failure;
    }
  };

  const handleSignup = (values: SignupInput): Promise<AuthResult> =>
    attempt(async () => {
      const payload: SignupData = {
        username: values.username,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        age: Number(values.age),
        location: values.location,
        ...(values.email ? { email: values.email } : {}),
        ...(values.bio ? { bio: values.bio } : {}),
      };
      afterAuth(await authAPI.signup(payload));
    });

  const handleLogin = (credentials: LoginCredentials): Promise<AuthResult> =>
    attempt(async () => {
      afterAuth(await authAPI.signin(credentials));
    });

  const handleLogout = (): void => {
    authAPI.signout();
    queryClient.clear();
    void navigate({ to: "/login" });
  };

  const updateUserProfile = (
    userId: number,
    profileData: ProfileUpdateData,
  ): Promise<AuthResult> =>
    attempt(async () => {
      await updateProfile.mutateAsync({ userId, data: profileData });
    });

  const value: AuthContextValue = {
    user,
    isLoading,
    error,
    handleSignup,
    handleLogin,
    handleLogout,
    updateUserProfile,
    refetchCurrentUser: () => void refetch(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
