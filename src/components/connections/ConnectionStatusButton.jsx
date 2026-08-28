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
  connectionStatus,
  onConnectionUpdate,
}) => {
  const { refreshNotifications } = useNotifications();
  const [actionLoading, setActionLoading] = useState(false);

  const sendRequestMutation = useSendConnectionRequest();
  const acceptRequestMutation = useAcceptConnectionRequest();
  const rejectRequestMutation = useRejectConnectionRequest();
  const removeConnectionMutation = useRemoveConnection();

  // Wraps a mutation with the shared loading flag + follow-up refreshes.
  const run = async (fn, { notify = true } = {}) => {
    setActionLoading(true);
    try {
      await fn();
      onConnectionUpdate?.();
      if (notify) refreshNotifications();
    } catch (error) {
      console.error("Connection action failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendRequest = () =>
    run(() => sendRequestMutation.mutateAsync(targetUserId));

  const handleAcceptRequest = () =>
    run(() => acceptRequestMutation.mutateAsync(connectionStatus.id));

  const handleRejectRequest = () =>
    run(() => rejectRequestMutation.mutateAsync(connectionStatus.id));

  const handleRemoveConnection = () => {
    if (!window.confirm("Remove this connection?")) return;
    run(() => removeConnectionMutation.mutateAsync(connectionStatus.id), {
      notify: false,
    });
  };

  if (targetUserId === currentUserId) return null;

  const connectButton = (variant = "primary") => (
    <Button
      variant={variant}
      size="sm"
      onClick={handleSendRequest}
      disabled={actionLoading}
    >
      {actionLoading ? "Sending..." : "🤝 Connect"}
    </Button>
  );

  if (!connectionStatus) return connectButton();

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
      }
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
      return connectButton("outline");

    default:
      return connectButton();
  }
};

export default ConnectionStatusButton;
