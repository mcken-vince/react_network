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
  const { data: profileUser, isLoading: userLoading, error } = useUser(userId);

  const isLoading = authLoading || userLoading;

  if (isLoading) {
    return <Loading />;
  }

  // Protected route - redirect to login if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If user not found, redirect to dashboard
  if (error || !profileUser?.user) {
    return <Navigate to="/dashboard" />;
  }

  const isOwnProfile = user.id.toString() === userId;

  return (
    <AuthenticatedLayout>
      <ProfilePage
        profileUser={profileUser?.user || {}}
        currentUser={user ?? {}}
        isOwnProfile={isOwnProfile}
      />
    </AuthenticatedLayout>
  );
}
