import UserCard from "./UserCard";
import EmptyState from "./EmptyState";
import "./UsersSection.css";

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
  const userCount = users.length;
  const sectionTitle = title || `Other Users (${userCount})`;

  return (
    <section className="users-section">
      <h2 className="section-title">{sectionTitle}</h2>
      {userCount === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="users-grid">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </section>
  );
}

export default UsersSection;
