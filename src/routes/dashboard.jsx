import { createFileRoute, Navigate } from "@tanstack/react-router";
import Dashboard from "../components/Dashboard";
import { AuthenticatedLayout } from "../components/layout";
import { useAuth } from "../hooks/useAuth";
import { useUsers } from "../hooks/useUsers";
import Loading from "../components/Loading";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: users = [], isLoading: usersLoading } = useUsers();

  const isLoading = authLoading || usersLoading;

  if (isLoading) {
    return <Loading />;
  }

  // Protected route - redirect to login if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <AuthenticatedLayout>
      <Dashboard user={user} allUsers={users} />
    </AuthenticatedLayout>
  );
}
