import { Link } from "@tanstack/react-router";
import { Card } from "../common";
import { Button, Flex, Text, Stack } from "../atoms";

const UserSearchResult = ({ user, onSendRequest }) => {
  const getConnectionButton = () => {
    const status = user.connectionStatus;

    if (!status) {
      // No connection exists
      return (
        <Button variant="primary" size="sm" onClick={onSendRequest}>
          Connect
        </Button>
      );
    }

    switch (status.status) {
      case "pending":
        if (status.isRequester) {
          return (
            <Button variant="outline" size="sm" disabled>
              Request Sent
            </Button>
          );
        } else {
          return (
            <Button variant="outline" size="sm" disabled>
              Request Received
            </Button>
          );
        }
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
    <Card>
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
          <Link to="/profile/$userId" params={{ userId: user.id.toString() }}>
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </Link>
          {getConnectionButton()}
        </Flex>
      </Flex>
    </Card>
  );
};

export default UserSearchResult;
