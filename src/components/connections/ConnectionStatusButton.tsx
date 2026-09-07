import { useState } from "react";
import { Button, Stack, Text } from "../atoms";
import { useRefreshNotifications } from "../../hooks/useNotifications";
import {
  useAcceptConnectionRequest,
  useRejectConnectionRequest,
  useRemoveConnection,
  useSendConnectionRequest,
} from "../../hooks/useConnections";
import type { ConnectionStatusInfo } from "../../types";

interface ConnectionStatusButtonProps {
  targetUserId: number;
  currentUserId: number;
  connectionStatus?: ConnectionStatusInfo | null;
  onConnectionUpdate?: () => void;
}

const ConnectionStatusButton = ({
  targetUserId,
  currentUserId,
  connectionStatus,
  onConnectionUpdate,
}: ConnectionStatusButtonProps) => {
  const refreshNotifications = useRefreshNotifications();
  const [busy, setBusy] = useState(false);

  const sendRequest = useSendConnectionRequest();
  const acceptRequest = useAcceptConnectionRequest();
  const rejectRequest = useRejectConnectionRequest();
  const removeConnection = useRemoveConnection();

  const run = async (
    action: () => Promise<unknown>,
    { notify = true }: { notify?: boolean } = {},
  ): Promise<void> => {
    setBusy(true);
    try {
      await action();
      onConnectionUpdate?.();
      if (notify) refreshNotifications();
    } catch (error) {
      console.error("Connection action failed:", error);
    } finally {
      setBusy(false);
    }
  };

  if (targetUserId === currentUserId) return null;

  const connectButton = (variant: "primary" | "outline" = "primary") => (
    <Button
      variant={variant}
      size="sm"
      disabled={busy}
      onClick={() => run(() => sendRequest.mutateAsync(targetUserId))}
    >
      {busy ? "Sending..." : "🤝 Connect"}
    </Button>
  );

  if (!connectionStatus) return connectButton();

  switch (connectionStatus.status) {
    case "pending":
      return connectionStatus.isRequester ? (
        <Stack spacing="xs">
          <Button variant="outline" size="sm" disabled>
            ⏳ Request Sent
          </Button>
          <Text size="xs" color="muted" className="text-center">
            Waiting for response
          </Text>
        </Stack>
      ) : (
        <Stack spacing="xs">
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() =>
                run(() => acceptRequest.mutateAsync(connectionStatus.id))
              }
            >
              ✅ Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() =>
                run(() => rejectRequest.mutateAsync(connectionStatus.id))
              }
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
            disabled={busy}
            className="text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => {
              if (!window.confirm("Remove this connection?")) return;
              void run(
                () => removeConnection.mutateAsync(connectionStatus.id),
                { notify: false },
              );
            }}
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
