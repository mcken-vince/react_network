import React, { useState } from "react";
import { Button, Flex, Text, Stack } from "../atoms";
import { Card } from "../common";
import { useNotifications } from "../../hooks/useNotificationsContext";
import { NOTIFICATION_CONFIG } from "../../config/notificationTypes";
import type { Notification } from "../../types";

interface NotificationCardProps {
  notification: Notification;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const [isActioning, setIsActioning] = useState(false);

  const handleMarkAsRead = async () => {
    if (notification.isRead) return;

    setIsActioning(true);
    try {
      await markAsRead(notification.id);
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async () => {
    setIsActioning(true);
    try {
      await deleteNotification(notification.id);
    } finally {
      setIsActioning(false);
    }
  };

  const getNotificationIcon = (): string => {
    const config = NOTIFICATION_CONFIG[notification.type as keyof typeof NOTIFICATION_CONFIG];
    return config ? config.icon : "📧";
  };

  const getNotificationColor = (): string => {
    if (notification.isRead) return "muted";

    const config = NOTIFICATION_CONFIG[notification.type as keyof typeof NOTIFICATION_CONFIG];
    return config ? `${config.color}-600` : "gray-600";
  };

  // Safely access user properties with optional chaining
  const getUserName = () => {
    if (!notification.relatedUser) return null;
    
    const user = notification.relatedUser;
    // Check for different possible name properties
    if ('firstName' in user && 'lastName' in user) {
      return `${user.firstName} ${user.lastName}`;
    } else if ('fullName' in user) {
      return user.fullName;
    } else if ('username' in user) {
      return user.username;
    }
    return 'Unknown User';
  };

  return (
    <Card
      className={`${!notification.isRead ? "border-l-4 border-blue-500 bg-blue-50" : ""}`}
    >
      <Stack spacing="sm">
        <Flex justify="between" align="start">
          <Flex align="center" gap="sm">
            <Text size="lg">{getNotificationIcon()}</Text>
            <Stack spacing="xs">
              <Text
                weight={!notification.isRead ? "semibold" : "medium"}
                color={getNotificationColor()}
              >
                {notification.type}
              </Text>
              <Text
                size="sm"
                color={notification.isRead ? "muted" : "gray-700"}
              >
                {notification.message}
              </Text>
            </Stack>
          </Flex>

          <Flex gap="xs">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                disabled={isActioning}
                title="Mark as read"
              >
                ✓
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isActioning}
              className="text-red-500 hover:text-red-700"
              title="Delete notification"
            >
              ×
            </Button>
          </Flex>
        </Flex>

        <Flex justify="between" align="center">
          <Text size="xs" color="muted">
            {new Date(notification.createdAt).toLocaleString()}
          </Text>

          {notification.relatedUser && (
            <Text size="xs" color="muted">
              From: {getUserName()}
            </Text>
          )}
        </Flex>
      </Stack>
    </Card>
  );
};

export default NotificationCard;
