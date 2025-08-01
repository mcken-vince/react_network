import { useMemo } from "react";
import {
  DashboardHeader,
  ProfileSection,
  UsersSection,
} from "./dashboard/index";
import "./Dashboard.css";

/**
 * Refactored Dashboard component using reusable components
 * @param {object} user - Current logged-in user
 * @param {function} onLogout - Logout handler
 * @param {array} allUsers - Array of all users
 */
function Dashboard({ user, onLogout, allUsers }) {
  // Memoize the filtered users list to avoid unnecessary recalculations
  const otherUsers = useMemo(() => {
    return allUsers.filter((u) => u.id !== user.id);
  }, [allUsers, user.id]);

  return (
    <div className="dashboard">
      <DashboardHeader
        user={user}
        onLogout={onLogout}
        appTitle="SocialConnect"
      />

      <main className="dashboard-content">
        <ProfileSection user={user} />

        <UsersSection
          users={otherUsers}
          emptyMessage="No other users yet. Invite your friends!"
        />
      </main>
    </div>
  );
}

export default Dashboard;
