import { createFileRoute, Navigate } from "@tanstack/react-router";
import LoginForm from "../components/forms/LoginForm";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

export const Route = createFileRoute("/login")({
  component: LoginRoute,
});

function LoginRoute() {
  const { user, isLoading, handleLogin } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return <LoginForm onLogin={handleLogin} />;
}
