import { createFileRoute, Navigate } from "@tanstack/react-router";
import Dashboard from "../components/Dashboard";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  const { user, users, isLoading, handleLogout } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  // Protected route - redirect to login if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Dashboard user={user} onLogout={handleLogout} allUsers={users} />;
}
