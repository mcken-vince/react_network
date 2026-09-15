import { useMemo } from "react";
import { Link, linkOptions, useNavigate } from "@tanstack/react-router";
import UserCard from "./dashboard/UserCard";
import { Button, Icon } from "./atoms";
import { Card } from "./common";
import type { IconName } from "./atoms/Icon";
import type { User, UserWithConnectionStatus } from "../types";

interface DashboardProps {
  user: User;
  allUsers: UserWithConnectionStatus[];
}

const DISCOVER_LIMIT = 8;

function Dashboard({ user, allUsers }: DashboardProps) {
  const navigate = useNavigate();

  // People worth discovering: not me, and not already connected.
  // Pending requests stay visible so they can be actioned from the card.
  const discoverable = useMemo(
    () =>
      allUsers.filter(
        (u) => u.id !== user.id && u.connectionStatus?.status !== "accepted",
      ),
    [allUsers, user.id],
  );

  // Literal class names so Tailwind's scanner can see them.
  const quickActions = [
    {
      icon: "profile",
      label: "My Profile",
      iconClass: "bg-blue-100 text-blue-600",
      link: linkOptions({
        to: "/profile/$userId",
        params: { userId: String(user.id) },
      }),
    },
    {
      icon: "handshake",
      label: "Connections",
      iconClass: "bg-green-100 text-green-600",
      link: linkOptions({ to: "/connections", search: { tab: "connections" } }),
    },
    {
      icon: "notifications",
      label: "Notifications",
      iconClass: "bg-purple-100 text-purple-600",
      link: linkOptions({ to: "/notifications" }),
    },
    {
      icon: "search",
      label: "Find People",
      iconClass: "bg-orange-100 text-orange-600",
      link: linkOptions({ to: "/connections", search: { tab: "search" } }),
    },
  ] satisfies {
    icon: IconName;
    label: string;
    iconClass: string;
    link: unknown;
  }[];

  return (
    <div className="space-y-8 p-6">
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

      <div className="grid md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.label} {...action.link}>
            <Card hoverable padding="medium" className="text-center group">
              <div
                className={`w-12 h-12 ${action.iconClass} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
              >
                <Icon name={action.icon} size="large" />
              </div>
              <p className="font-semibold text-gray-800">{action.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Discover People</h2>
          <Link to="/connections" search={{ tab: "search" }}>
            <Button variant="outline" size="medium">
              View All
            </Button>
          </Link>
        </div>

        {discoverable.length === 0 ? (
          <Card padding="large" className="text-center text-gray-500">
            {allUsers.length > 1
              ? "You're already connected with everyone here. Invite your friends!"
              : "No other users yet. Invite your friends!"}
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {discoverable.slice(0, DISCOVER_LIMIT).map((otherUser) => (
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
