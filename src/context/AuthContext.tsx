import { createContext, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, authAPI, userAPI } from "../lib/api";
import { useCurrentUser } from "../hooks/useUsers";
import { userKeys } from "../lib/queryKeys";
import type {
  AuthResponse,
  LoginCredentials,
  ProfileUpdateData,
  SignupData,
  User,
  UserResponse,
} from "../types";

export type SignupInput = Omit<SignupData, "age"> & {
  age: number | string;
  confirmPassword?: string;
};
export interface AuthResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  handleSignup: (values: SignupInput) => Promise<AuthResult>;
  handleLogin: (credentials: LoginCredentials) => Promise<AuthResult>;
  handleLogout: () => void;
  updateUserProfile: (
    userId: number,
    data: ProfileUpdateData,
  ) => Promise<AuthResult>;
  refetchCurrentUser: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const toFailure = (error: unknown): AuthResult =>
  error instanceof ApiError
    ? { success: false, message: error.message, errors: error.errors }
    : { success: false, message: "Something went wrong" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useCurrentUser();
  const user = data?.user ?? null;

  const afterAuth = (res: AuthResponse): void => {
    queryClient.setQueryData<UserResponse>(userKeys.current(), {
      user: res.user,
    });
    navigate({ to: "/dashboard" });
  };

  const handleSignup = async (values: SignupInput): Promise<AuthResult> => {
    setError(null);
    try {
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
      return { success: true };
    } catch (err) {
      const failure = toFailure(err);
      setError(failure.message ?? null);
      return failure;
    }
  };

  const handleLogin = async (
    credentials: LoginCredentials,
  ): Promise<AuthResult> => {
    setError(null);
    try {
      afterAuth(await authAPI.signin(credentials));
      return { success: true };
    } catch (err) {
      const failure = toFailure(err);
      setError(failure.message ?? null);
      return failure;
    }
  };

  const handleLogout = (): void => {
    authAPI.signout();
    queryClient.clear();
    navigate({ to: "/login" });
  };

  const updateUserProfile = async (
    userId: number,
    profileData: ProfileUpdateData,
  ): Promise<AuthResult> => {
    setError(null);
    try {
      const res = await userAPI.updateProfile(userId, profileData);
      queryClient.setQueryData(userKeys.detail(userId), res);
      queryClient.setQueryData<UserResponse | undefined>(
        userKeys.current(),
        (old) =>
          old && old.user.id === userId ? { ...old, user: res.user } : old,
      );
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: userKeys.withConnectionStatus(),
      });
      return { success: true };
    } catch (err) {
      const failure = toFailure(err);
      setError(failure.message ?? null);
      return failure;
    }
  };

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
