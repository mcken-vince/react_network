import { Link } from "@tanstack/react-router";
import { Card } from "../common";
import { Button, Flex, Stack, Text } from "../atoms";
import type { UserWithConnectionStatus } from "../../types";

interface UserSearchResultProps {
  user: UserWithConnectionStatus;
  onSendRequest: () => void;
  onMouseEnter?: () => void;
}

const UserSearchResult = ({
  user,
  onSendRequest,
  onMouseEnter,
}: UserSearchResultProps) => {
  const status = user.connectionStatus;

  const connectionButton = () => {
    if (!status) {
      return (
        <Button variant="primary" size="sm" onClick={onSendRequest}>
          Connect
        </Button>
      );
    }
    switch (status.status) {
      case "pending":
        return (
          <Button variant="outline" size="sm" disabled>
            {status.isRequester ? "Request Sent" : "Request Received"}
          </Button>
        );
      case "accepted":
        return (
          <Button variant="outline" size="sm" disabled>
            ✅ Connected
          </Button>
        );
      case "rejected":
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={onSendRequest}
            className="text-blue-600"
          >
            Connect
          </Button>
        );
      default:
        return (
          <Button variant="primary" size="sm" onClick={onSendRequest}>
            Connect
          </Button>
        );
    }
  };

  return (
    <Card onMouseEnter={onMouseEnter}>
      <Flex justify="between" align="center">
        <Stack spacing="sm">
          <Text size="lg" weight="semibold">
            {user.firstName} {user.lastName}
          </Text>
          <Text size="sm" color="muted">
            @{user.username}
          </Text>
          {user.location && (
            <Text size="sm" color="muted">
              📍 {user.location}
            </Text>
          )}
          <Text size="xs" color="muted">
            Age: {user.age}
          </Text>
        </Stack>
        <Flex gap="sm">
          <Link to="/profile/$userId" params={{ userId: String(user.id) }}>
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </Link>
          {connectionButton()}
        </Flex>
      </Flex>
    </Card>
  );
};

export default UserSearchResult;
