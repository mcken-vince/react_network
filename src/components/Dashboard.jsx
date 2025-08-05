import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  DashboardHeader,
  ProfileSection,
  UsersSection,
} from "./dashboard/index";

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
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        user={user}
        onLogout={onLogout}
        appTitle="SocialConnect"
      />

      <main className="p-6 max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ProfileSection user={user} />
          <div className="mt-4">
            <Link 
              to={`/profile/${user.id}`} 
              className="block text-center py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              View Full Profile
            </Link>
          </div>
        </div>

        <div className="md:col-span-2">
          <UsersSection
            users={otherUsers}
            emptyMessage="No other users yet. Invite your friends!"
          />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
