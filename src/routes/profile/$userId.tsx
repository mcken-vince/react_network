import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";
import { useUser } from "../../hooks/useUsers";
import Loading from "../../components/Loading";
import { AuthenticatedLayout } from "../../components/layout";
import ProfilePage from "../../components/profile/ProfilePage";

export const Route = createFileRoute("/profile/$userId")({
  component: ProfileRoute,
});

function ProfileRoute() {
  const { userId } = Route.useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading: userLoading, error } = useUser(userId);

  if (authLoading || userLoading) return <Loading />;
  if (!user) return <Navigate to="/login" />;

  // Unknown / unreachable user → back to the dashboard.
  if (error || !data?.user) return <Navigate to="/dashboard" />;

  return (
    <AuthenticatedLayout>
      <ProfilePage
        profileUser={data.user}
        currentUser={user}
        isOwnProfile={String(user.id) === userId}
      />
    </AuthenticatedLayout>
  );
}
