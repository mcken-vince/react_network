import { Button, Flex, Heading, Icon, Stack, Text } from "../atoms";
import { useNotificationsFeature } from "../../hooks/useNotifications";
import NotificationCard from "./NotificationCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface NotificationsListProps {
  onNavigate?: () => void;
}

const NotificationsList = ({ onNavigate }: NotificationsListProps) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    hasMore,
    isLoadingMore,
    loadMore,
    refresh,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotificationsFeature();

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
            onClick={() => refresh()}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            {isRefreshing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Icon name="refresh" size="small" />
            )}
            <span>Refresh</span>
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
            >
              {isMarkingAllAsRead ? "Marking..." : "Mark All Read"}
            </Button>
          )}
        </Flex>
      </Flex>

      {unreadCount > 0 && (
        <Text size="sm" color="muted">
          {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
        </Text>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Text>No notifications yet</Text>
        </div>
      ) : (
        <Stack spacing="sm">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onNavigate={onNavigate}
            />
          ))}
          {hasMore && (
            <Flex justify="center" className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading…" : "Load more"}
              </Button>
            </Flex>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default NotificationsList;
