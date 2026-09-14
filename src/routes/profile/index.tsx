import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";
import Loading from "../../components/Loading";

export const Route = createFileRoute("/profile/")({
  component: ProfileIndexRoute,
});

/** /profile → the current user's own profile. */
function ProfileIndexRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  return (
    <Navigate to="/profile/$userId" params={{ userId: String(user.id) }} />
  );
}
