import { createContext, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { authAPI, userAPI } from "../utils/api";
import { useCurrentUser, userKeys } from "../hooks/useUsers";

const AuthContext = createContext(null);

export { AuthContext };

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  // Use React Query for current user data
  const {
    data: userData,
    isLoading,
    error: queryError,
    refetch: refetchCurrentUser,
  } = useCurrentUser();

  const user = userData?.user;

  const handleSignup = async (userData) => {
    setError(null);
    try {
      const response = await authAPI.signup(userData);

      // Update the current user cache with the new user data
      queryClient.setQueryData(userKeys.current(), response);

      // Navigate to dashboard after successful signup
      navigate({ to: "/dashboard" });
      return { success: true };
    } catch (err) {
      const message = err.message || "Signup failed";
      setError(message);
      return { success: false, message };
    }
  };

  const handleLogin = async (credentials) => {
    setError(null);
    try {
      const response = await authAPI.signin(credentials);

      // Update the current user cache with the new user data
      queryClient.setQueryData(userKeys.current(), response);

      // Navigate to dashboard after successful login
      navigate({ to: "/dashboard" });
      return { success: true };
    } catch (err) {
      const message = err.message || "Invalid username or password";
      setError(message);
      return { success: false, message };
    }
  };

  const handleLogout = () => {
    authAPI.signout();

    // Clear all React Query caches
    queryClient.clear();

    // Navigate to login page after logout
    navigate({ to: "/login" });
  };

  const updateUserProfile = async (userId, updateData) => {
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
    } catch (err) {
      const message = err.message || "Failed to update profile";
      setError(message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    isLoading,
    error: error || queryError?.message,
    handleSignup,
    handleLogin,
    handleLogout,
    updateUserProfile,
    refetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
