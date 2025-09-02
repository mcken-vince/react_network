import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ProfileSection, UsersSection } from "./dashboard/index";
import { Container, Grid, Stack, Button } from "./atoms";
import { Card } from "./common";
import { UserCard } from "./dashboard/index";

/**
 * Refactored Dashboard component using reusable components
 * @param {object} user - Current logged-in user
 * @param {array} allUsers - Array of all users
 */
function Dashboard({ user, allUsers }) {
  const otherUsers = useMemo(() => {
    return allUsers.filter((u) => u.id !== user.id);
  }, [allUsers, user.id]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl text-white p-8 shadow-xl">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-blue-100 text-lg">
            Ready to connect with your network?
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          {
            to: `/profile/${user.id}`,
            icon: "👤",
            label: "My Profile",
            color: "blue",
          },
          {
            to: "/connections",
            icon: "🤝",
            label: "Connections",
            color: "green",
          },
          {
            to: "/notifications",
            icon: "🔔",
            label: "Notifications",
            color: "purple",
          },
          {
            to: "/connections?tab=search",
            icon: "🔍",
            label: "Find People",
            color: "orange",
          },
        ].map((action) => (
          <Link key={action.to} to={action.to}>
            <Card hoverable padding="medium" className="text-center group">
              <div
                className={`w-12 h-12 bg-${action.color}-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
              >
                <span className="text-2xl">{action.icon}</span>
              </div>
              <p className="font-semibold text-gray-800">{action.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* User Grid with better styling */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Discover People</h2>
          <Link to="/connections?tab=search">
            <Button variant="outline" size="medium">
              View All
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {otherUsers.slice(0, 8).map((user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUser={user}
              hoverable
              showConnectionStatus
              className="h-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
