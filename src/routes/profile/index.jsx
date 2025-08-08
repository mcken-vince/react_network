import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";
import Loading from "../../components/Loading";

export const Route = createFileRoute("/profile/")({
  component: ProfileIndexRoute,
});

function ProfileIndexRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  // Protected route - redirect to login if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect to user's own profile
  return <Navigate to={`/profile/${user.id}`} />;
}
