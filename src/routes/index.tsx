import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/Loading";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function IndexRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loading />;
  return user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
}
