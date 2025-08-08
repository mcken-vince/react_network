import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ProfileSection, UsersSection } from "./dashboard/index";
import { Container, Grid, Stack, Button } from "./atoms";

/**
 * Refactored Dashboard component using reusable components
 * @param {object} user - Current logged-in user
 * @param {array} allUsers - Array of all users
 */
function Dashboard({ user, allUsers }) {
  // Memoize the filtered users list to avoid unnecessary recalculations
  const otherUsers = useMemo(() => {
    return allUsers.filter((u) => u.id !== user.id);
  }, [allUsers, user.id]);

  return (
    <Container size="large" padding="medium">
      <Grid cols={1} mdCols={3} gap="medium" className="min-h-screen">
        <div className="md:col-span-1">
          <Stack spacing="medium">
            <ProfileSection user={user} />
            <Stack spacing="sm">
              <Link
                to={`/profile/${user.id}`}
                className="block text-center py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                View Full Profile
              </Link>
              <Link
                to="/connections"
                className="block text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                🤝 Connections
              </Link>
              <Link
                to="/notifications"
                className="block text-center py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                🔔 Notifications
              </Link>
            </Stack>
          </Stack>
        </div>

        <div className="md:col-span-2">
          <UsersSection
            users={otherUsers}
            currentUser={user}
            showConnectionStatus={true}
            emptyMessage="No other users yet. Invite your friends!"
          />
        </div>
      </Grid>
    </Container>
  );
}

export default Dashboard;
