import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button, Flex, Stack, Text } from "../atoms";
import { Card } from "../common";
import {
  useDeleteNotification,
  useMarkNotificationAsRead,
} from "../../hooks/useNotifications";
import { describeNotification } from "../../lib/notifications";
import type { NotificationLink } from "../../lib/notifications";
import type { Notification } from "../../types";

interface NotificationCardProps {
  notification: Notification;
  /** Called after navigating via the card's link (e.g. to close a dropdown). */
  onNavigate?: () => void;
}

function NotificationLinkWrapper({
  link,
  onClick,
  children,
}: {
  link: NotificationLink | null;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (!link) return <>{children}</>;
  const className =
    "block -m-1 p-1 rounded-lg hover:bg-gray-50 transition-colors";

  switch (link.to) {
    case "/profile/$userId":
      return (
        <Link
          to="/profile/$userId"
          params={link.params}
          className={className}
          onClick={onClick}
        >
          {children}
        </Link>
      );
    case "/connections":
      return (
        <Link
          to="/connections"
          search={link.search}
          className={className}
          onClick={onClick}
        >
          {children}
        </Link>
      );
    case "/messages":
      return (
        <Link
          to="/messages"
          search={link.search}
          className={className}
          onClick={onClick}
        >
          {children}
        </Link>
      );
    case "/feed":
      return (
        <Link to="/feed" className={className} onClick={onClick}>
          {children}
        </Link>
      );
    case "/posts/$postId":
      return (
        <Link
          to="/posts/$postId"
          params={link.params}
          className={className}
          onClick={onClick}
        >
          {children}
        </Link>
      );
  }
}

const NotificationCard = ({
  notification,
  onNavigate,
}: NotificationCardProps) => {
  const markAsRead = useMarkNotificationAsRead();
  const deleteNotification = useDeleteNotification();
  const { icon, title, body, actorName, link } =
    describeNotification(notification);

  const handleOpen = () => {
    if (!notification.isRead) markAsRead.mutate(notification.id);
    onNavigate?.();
  };

  return (
    <Card
      className={
        notification.isRead ? "" : "border-l-4 border-blue-500 bg-blue-50"
      }
    >
      <Flex justify="between" align="start" gap="sm">
        <div className="flex-1 min-w-0">
          <NotificationLinkWrapper link={link} onClick={handleOpen}>
            <Flex align="start" gap="sm">
              <Text size="lg" aria-hidden>
                {icon}
              </Text>
              <Stack spacing="xs" className="min-w-0">
                <Text weight={notification.isRead ? "medium" : "semibold"}>
                  {title}
                </Text>
                {body && body !== title && (
                  <Text
                    size="sm"
                    color={notification.isRead ? "muted" : "gray-700"}
                  >
                    {body}
                  </Text>
                )}
                <Flex gap="sm" align="center">
                  <Text size="xs" color="muted">
                    {new Date(notification.createdAt).toLocaleString()}
                  </Text>
                  {actorName && (
                    <Text size="xs" color="muted">
                      · {actorName}
                    </Text>
                  )}
                  {link && (
                    <Text size="xs" color="blue-600">
                      · View
                    </Text>
                  )}
                </Flex>
              </Stack>
            </Flex>
          </NotificationLinkWrapper>
        </div>

        <Flex gap="xs">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              title="Mark as read"
              disabled={markAsRead.isPending}
              onClick={() => markAsRead.mutate(notification.id)}
            >
              ✓
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            title="Delete notification"
            className="text-red-500 hover:text-red-700"
            disabled={deleteNotification.isPending}
            onClick={() => deleteNotification.mutate(notification.id)}
          >
            ×
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

export default NotificationCard;
