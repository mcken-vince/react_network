import React, { useState } from "react";
import { Button, Flex, Stack, Text, Heading } from "../atoms";
import { useNotifications } from "../../hooks/useNotificationsContext";
import NotificationCard from "./NotificationCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";

const NotificationsList: React.FC = () => {
  const { 
    notifications, 
    isLoading, 
    isRefreshing,
    markAllAsRead, 
    loadNotifications 
  } = useNotifications();
  
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const hasUnread = unreadNotifications.length > 0;

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleRefresh = async () => {
    await loadNotifications();
  };

  if (isLoading && notifications.length === 0) {
    return (
      <Stack spacing="md">
        <Heading level={3}>Notifications</Heading>
        <div className="text-center py-8 text-gray-500">
          Loading notifications...
        </div>
      </Stack>
    );
  }

  return (
    <Stack spacing="md">
      <Flex justify="between" align="center">
        <Heading level={3}>Notifications</Heading>
        <Flex gap="sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            {isRefreshing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <span className="inline-block">🔄</span>
            )}
            <span>Refresh</span>
          </Button>
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead}
            >
              {isMarkingAllRead ? "Marking..." : "Mark All Read"}
            </Button>
          )}
        </Flex>
      </Flex>

      {hasUnread && (
        <Text size="sm" color="muted">
          {unreadNotifications.length} unread notification
          {unreadNotifications.length !== 1 ? "s" : ""}
        </Text>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Text>No notifications yet</Text>
          <Text size="sm" color="muted" className="mt-2">
            You'll receive notifications when someone sends you a connection
            request
          </Text>
        </div>
      ) : (
        <Stack spacing="sm">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default NotificationsList;
