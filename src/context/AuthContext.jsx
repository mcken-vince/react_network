import { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useNavigate } from "@tanstack/react-router";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser, userLoading] = useLocalStorage(
    "socialconnect-current-user",
    null
  );
  const [users, setUsers, usersLoading] = useLocalStorage(
    "socialconnect-users",
    []
  );

  const isLoading = userLoading || usersLoading;

  const handleSignup = (userData) => {
    // Check if username is unique
    const usernameExists = users.some((u) => u.username === userData.username);
    if (usernameExists) {
      return { success: false, message: "Username already exists" };
    }

    const newUser = {
      ...userData,
      id: Date.now(),
      // Remove confirmPassword from stored user data
      confirmPassword: undefined,
    };
    setUsers((prev) => [...prev, newUser]);
    setUser(newUser);

    // Navigate to dashboard after successful signup
    navigate({ to: "/dashboard" });
    return { success: true };
  };

  const handleLogin = (credentials) => {
    const foundUser = users.find(
      (u) =>
        u.username === credentials.username &&
        u.password === credentials.password
    );

    if (!foundUser) {
      return { success: false, message: "Invalid username or password" };
    }

    setUser(foundUser);

    // Navigate to dashboard after successful login
    navigate({ to: "/dashboard" });
    return { success: true };
  };

  const handleLogout = () => {
    setUser(null);
    // Navigate to login page after logout
    navigate({ to: "/login" });
  };

  const value = {
    user,
    users,
    isLoading,
    handleSignup,
    handleLogin,
    handleLogout,
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
