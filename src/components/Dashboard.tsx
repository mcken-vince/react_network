import { useMemo } from "react";
import { Link, linkOptions, useNavigate } from "@tanstack/react-router";
import UserCard from "./dashboard/UserCard";
import { Button } from "./atoms";
import { Card } from "./common";
import type { User, UserWithConnectionStatus } from "../types";

interface DashboardProps {
  user: User;
  allUsers: UserWithConnectionStatus[];
}

function Dashboard({ user, allUsers }: DashboardProps) {
  const navigate = useNavigate();

  const otherUsers = useMemo(
    () => allUsers.filter((u) => u.id !== user.id),
    [allUsers, user.id],
  );

  // Literal class names so Tailwind's scanner can see them (no `bg-${x}-100`).
  const quickActions = [
    {
      icon: "👤",
      label: "My Profile",
      iconBg: "bg-blue-100",
      link: linkOptions({
        to: "/profile/$userId",
        params: { userId: String(user.id) },
      }),
    },
    {
      icon: "🤝",
      label: "Connections",
      iconBg: "bg-green-100",
      link: linkOptions({ to: "/connections", search: { tab: "connections" } }),
    },
    {
      icon: "🔔",
      label: "Notifications",
      iconBg: "bg-purple-100",
      link: linkOptions({ to: "/notifications" }),
    },
    {
      icon: "🔍",
      label: "Find People",
      iconBg: "bg-orange-100",
      link: linkOptions({ to: "/connections", search: { tab: "search" } }),
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Welcome */}
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

      {/* Quick actions */}
      <div className="grid md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.label} {...action.link}>
            <Card hoverable padding="medium" className="text-center group">
              <div
                className={`w-12 h-12 ${action.iconBg} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
              >
                <span className="text-2xl">{action.icon}</span>
              </div>
              <p className="font-semibold text-gray-800">{action.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Discover people */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Discover People</h2>
          <Link to="/connections" search={{ tab: "search" }}>
            <Button variant="outline" size="medium">
              View All
            </Button>
          </Link>
        </div>

        {otherUsers.length === 0 ? (
          <Card padding="large" className="text-center text-gray-500">
            No other users yet. Invite your friends!
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {otherUsers.slice(0, 8).map((otherUser) => (
              <UserCard
                key={otherUser.id}
                user={otherUser}
                currentUser={user}
                hoverable
                showConnectionStatus
                onClick={() =>
                  void navigate({
                    to: "/profile/$userId",
                    params: { userId: String(otherUser.id) },
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
