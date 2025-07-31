import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function IndexRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  // Redirect to dashboard if logged in, otherwise to login
  return <Navigate to={user ? "/dashboard" : "/login"} />;
}
