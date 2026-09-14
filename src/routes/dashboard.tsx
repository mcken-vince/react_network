import { createFileRoute, Navigate } from "@tanstack/react-router";
import Dashboard from "../components/Dashboard";
import { AuthenticatedLayout } from "../components/layout";
import { useAuth } from "../hooks/useAuth";
import { useUsersWithConnectionStatus } from "../hooks/useUsers";
import Loading from "../components/Loading";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: users = [], isLoading: usersLoading } =
    useUsersWithConnectionStatus();

  if (authLoading || usersLoading) return <Loading />;
  if (!user) return <Navigate to="/login" />;

  return (
    <AuthenticatedLayout>
      <Dashboard user={user} allUsers={users} />
    </AuthenticatedLayout>
  );
}
