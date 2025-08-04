import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "../../context/AuthContext";
import Loading from "../../components/Loading";
import ProfilePage from "../../components/profile/ProfilePage";

export const Route = createFileRoute("/profile/$userId")({
  component: ProfileRoute,
});

function ProfileRoute() {
  const { userId } = Route.useParams();
  const { user, users, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  // Protected route - redirect to login if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Find the profile user
  const profileUser = users.find((u) => u.id.toString() === userId);

  // If user not found, redirect to dashboard
  if (!profileUser) {
    return <Navigate to="/dashboard" />;
  }

  const isOwnProfile = user.id.toString() === userId;

  return (
    <ProfilePage
      profileUser={profileUser}
      currentUser={user}
      isOwnProfile={isOwnProfile}
    />
  );
}
