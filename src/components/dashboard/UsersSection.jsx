import UserCard from "./UserCard";
import EmptyState from "./EmptyState";
import { useNavigate } from "@tanstack/react-router";

/**
 * Users section component for displaying a grid of users
 * @param {array} users - Array of user objects to display
 * @param {string} title - Section title
 * @param {string} emptyMessage - Message to show when no users are available
 */
function UsersSection({
  users,
  title,
  emptyMessage = "No other users yet. Invite your friends!",
}) {
  const navigate = useNavigate();
  const userCount = users.length;
  const sectionTitle = title || `Other Users (${userCount})`;

  return (
    <section className="flex flex-col">
      <h2 className="text-gray-800 mb-4 text-2xl font-semibold">{sectionTitle}</h2>
      {userCount === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onClick={() => navigate({ to: `/profile/${user.id}` })}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default UsersSection;
