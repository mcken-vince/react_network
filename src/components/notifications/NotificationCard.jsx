import { useState } from "react";
import { Button, Flex, Text, Stack } from "../atoms";
import { Card } from "../common";
import { useNotifications } from "../../hooks/useNotificationsContext";

const NotificationCard = ({ notification }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const [isActioning, setIsActioning] = useState(false);

  const handleMarkAsRead = async () => {
    if (notification.isRead) return;

    setIsActioning(true);
    await markAsRead(notification.id);
    setIsActioning(false);
  };

  const handleDelete = async () => {
    setIsActioning(true);
    await deleteNotification(notification.id);
    setIsActioning(false);
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "connection_request":
        return "🤝";
      case "connection_accepted":
        return "✅";
      case "connection_rejected":
        return "❌";
      default:
        return "📧";
    }
  };

  const getNotificationColor = () => {
    if (notification.isRead) return "muted";

    switch (notification.type) {
      case "connection_request":
        return "blue-600";
      case "connection_accepted":
        return "green-600";
      case "connection_rejected":
        return "red-600";
      default:
        return "gray-600";
    }
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
                {notification.title}
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
              From: {notification.relatedUser.firstName}{" "}
              {notification.relatedUser.lastName}
            </Text>
          )}
        </Flex>
      </Stack>
    </Card>
  );
};

export default NotificationCard;
