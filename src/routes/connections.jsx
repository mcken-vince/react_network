import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/Loading";
import { AuthenticatedLayout } from "../components/layout";
import ConnectionsPage from "../components/connections/ConnectionsPage";

export const Route = createFileRoute("/connections")({
  component: ConnectionsRoute,
});

function ConnectionsRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  // Protected route - redirect to login if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <AuthenticatedLayout>
      <ConnectionsPage user={user} />
    </AuthenticatedLayout>
  );
}
