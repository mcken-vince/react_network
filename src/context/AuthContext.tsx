import React, { createContext, useState, ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { authAPI, userAPI } from "../utils/api";
import { useCurrentUser, userKeys } from "../hooks/useUsers";
import type { User } from "../types";

interface SignupData {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  email?: string;
  bio?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextValue {
  user: User | null | undefined;
  isLoading: boolean;
  error: string | null | undefined;
  handleSignup: (userData: SignupData) => Promise<AuthResult>;
  handleLogin: (credentials: LoginCredentials) => Promise<AuthResult>;
  handleLogout: () => void;
  updateUserProfile: (
    userId: number,
    updateData: Partial<User>
  ) => Promise<AuthResult>;
  refetchCurrentUser: () => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext };

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Use React Query for current user data
  const {
    data: userData,
    isLoading,
    error: queryError,
    refetch: refetchCurrentUser,
  } = useCurrentUser();

  const user = userData?.user;

  const handleSignup = async (userData: SignupData): Promise<AuthResult> => {
    setError(null);
    try {
      const response = await authAPI.signup(userData);

      // Update the current user cache with the new user data
      queryClient.setQueryData(userKeys.current(), response);

      // Navigate to dashboard after successful signup
      navigate({ to: "/dashboard" });
      return { success: true };
    } catch (err: any) {
      const message = err.message || "Signup failed";
      setError(message);
      return { success: false, message };
    }
  };

  const handleLogin = async (
    credentials: LoginCredentials
  ): Promise<AuthResult> => {
    setError(null);
    try {
      const response = await authAPI.signin(credentials);

      // Update the current user cache with the new user data
      queryClient.setQueryData(userKeys.current(), response);

      // Navigate to dashboard after successful login
      navigate({ to: "/dashboard" });
      return { success: true };
    } catch (err: any) {
      const message = err.message || "Invalid username or password";
      setError(message);
      return { success: false, message };
    }
  };

  const handleLogout = (): void => {
    authAPI.signout();

    // Clear all React Query caches
    queryClient.clear();

    // Navigate to login page after logout
    navigate({ to: "/login" });
  };

  const updateUserProfile = async (
    userId: number,
    updateData: Partial<User>
  ): Promise<AuthResult> => {
    setError(null);
    try {
      const response = await userAPI.updateProfile(userId, updateData);

      // Update React Query caches
      queryClient.setQueryData(userKeys.detail(userId), response);

      // Update current user cache if it's the same user
      if (user && user.id === userId) {
        queryClient.setQueryData(userKeys.current(), response);
      }

      return { success: true };
    } catch (err: any) {
      const message = err.message || "Failed to update profile";
      setError(message);
      return { success: false, message };
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    error: error || (queryError as any)?.message,
    handleSignup,
    handleLogin,
    handleLogout,
    updateUserProfile,
    refetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
