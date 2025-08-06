import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authAPI, userAPI } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing auth token and fetch user data on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const userData = await userAPI.getCurrentUser();
          setUser(userData.user);
        } catch (err) {
          console.error("Failed to fetch user:", err);
          localStorage.removeItem("authToken");
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Fetch users list when user is authenticated
  useEffect(() => {
    const fetchUsers = async () => {
      if (user) {
        try {
          const data = await userAPI.getAllUsers();
          setUsers(data.users || []);
        } catch (err) {
          console.error("Failed to fetch users:", err);
        }
      }
    };

    fetchUsers();
  }, [user]);

  const handleSignup = async (userData) => {
    setError(null);
    try {
      const response = await authAPI.signup(userData);
      setUser(response.user);

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
      setUser(response.user);

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
    setUser(null);
    setUsers([]);
    // Navigate to login page after logout
    navigate({ to: "/login" });
  };

  const updateUserProfile = async (userId, updateData) => {
    setError(null);
    try {
      const response = await userAPI.updateProfile(userId, updateData);

      // Update local user state if it's the current user
      if (user && user.id === userId) {
        setUser(response.user);
      }

      // Update users list
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? response.user : u))
      );

      return { success: true };
    } catch (err) {
      const message = err.message || "Failed to update profile";
      setError(message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    users,
    isLoading,
    error,
    handleSignup,
    handleLogin,
    handleLogout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
