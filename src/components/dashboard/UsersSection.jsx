import UserCard from "./UserCard";
import EmptyState from "./EmptyState";
import { useNavigate } from "@tanstack/react-router";
import { Heading, Grid, Stack } from "../atoms";

/**
 * Users section component for displaying a grid of users
 * @param {array} users - Array of user objects to display
 * @param {object} currentUser - Current logged-in user (optional)
 * @param {string} title - Section title
 * @param {string} emptyMessage - Message to show when no users are available
 * @param {boolean} showConnectionStatus - Whether to show connection status buttons
 */
function UsersSection({
  users,
  currentUser,
  title,
  emptyMessage = "No other users yet. Invite your friends!",
  showConnectionStatus = false,
}) {
  const navigate = useNavigate();
  const userCount = users.length;
  const sectionTitle = title || `Other Users (${userCount})`;

  return (
    <Stack as="section" spacing="medium">
      <Heading level={2} color="gray-800" className="mb-0">
        {sectionTitle}
      </Heading>
      {userCount === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <Grid cols={1} mdCols={2} lgCols={3} gap="medium">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUser={currentUser}
              showConnectionStatus={showConnectionStatus}
              onClick={() => navigate({ to: `/profile/${user.id}` })}
            />
          ))}
        </Grid>
      )}
    </Stack>
  );
}

export default UsersSection;
