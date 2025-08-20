import { useState } from "react";
import { Button, Stack, Text } from "../atoms";
import { useNotifications } from "../../hooks/useNotificationsContext";
import {
  useSendConnectionRequest,
  useAcceptConnectionRequest,
  useRejectConnectionRequest,
  useRemoveConnection,
} from "../../hooks/useConnections";

const ConnectionStatusButton = ({
  targetUserId,
  currentUserId,
  connectionStatus, // Now passed as prop from parent
  onConnectionUpdate,
}) => {
  const { refreshNotifications } = useNotifications();
  const [actionLoading, setActionLoading] = useState(false);

  // Use React Query mutation hooks
  const sendRequestMutation = useSendConnectionRequest();
  const acceptRequestMutation = useAcceptConnectionRequest();
  const rejectRequestMutation = useRejectConnectionRequest();
  const removeConnectionMutation = useRemoveConnection();

  const handleSendRequest = async () => {
    setActionLoading(true);
    try {
      await sendRequestMutation.mutateAsync(targetUserId);
      onConnectionUpdate?.();
      refreshNotifications();
    } catch (error) {
      console.error("Error sending connection request:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    setActionLoading(true);
    try {
      await acceptRequestMutation.mutateAsync(connectionStatus.id);
      onConnectionUpdate?.();
      refreshNotifications();
    } catch (error) {
      console.error("Error accepting connection request:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    setActionLoading(true);
    try {
      await rejectRequestMutation.mutateAsync(connectionStatus.id);
      onConnectionUpdate?.();
      refreshNotifications();
    } catch (error) {
      console.error("Error rejecting connection request:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveConnection = async () => {
    setActionLoading(true);
    try {
      await removeConnectionMutation.mutateAsync(connectionStatus.id);
      onConnectionUpdate?.();
    } catch (error) {
      console.error("Error removing connection:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Don't render if it's the user's own profile
  if (targetUserId === currentUserId) {
    return null; // Don't show connection button for own profile
  }

  if (!connectionStatus) {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={handleSendRequest}
        disabled={actionLoading}
      >
        {actionLoading ? "Sending..." : "🤝 Connect"}
      </Button>
    );
  }

  switch (connectionStatus.status) {
    case "pending":
      if (connectionStatus.isRequester) {
        return (
          <Stack spacing="xs">
            <Button variant="outline" size="sm" disabled>
              ⏳ Request Sent
            </Button>
            <Text size="xs" color="muted" className="text-center">
              Waiting for response
            </Text>
          </Stack>
        );
      } else {
        return (
          <Stack spacing="xs">
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAcceptRequest}
                disabled={actionLoading}
              >
                ✅ Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectRequest}
                disabled={actionLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                ❌ Decline
              </Button>
            </div>
            <Text size="xs" color="muted" className="text-center">
              Wants to connect
            </Text>
          </Stack>
        );
      }

    case "accepted":
      return (
        <Stack spacing="xs">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveConnection}
            disabled={actionLoading}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            ✅ Connected
          </Button>
          <Text size="xs" color="muted" className="text-center">
            Click to remove connection
          </Text>
        </Stack>
      );

    case "rejected":
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendRequest}
          disabled={actionLoading}
        >
          {actionLoading ? "Sending..." : "🤝 Connect"}
        </Button>
      );

    default:
      return (
        <Button
          variant="primary"
          size="sm"
          onClick={handleSendRequest}
          disabled={actionLoading}
        >
          {actionLoading ? "Sending..." : "🤝 Connect"}
        </Button>
      );
  }
};

export default ConnectionStatusButton;
