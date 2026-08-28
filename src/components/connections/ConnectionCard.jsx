import { Link } from "@tanstack/react-router";
import { Card } from "../common";
import { Button, Flex, Text, Stack } from "../atoms";

/**
 * An accepted connection. The server returns both `requester` and
 * `recipient`; we show whichever one isn't the current user.
 */
const ConnectionCard = ({ connection, currentUserId, onRemove }) => {
  const user =
    connection.requesterId === currentUserId
      ? connection.recipient
      : connection.requester;

  if (!user) return null; // defensive: malformed row shouldn't take the page down

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
            Connected since{" "}
            {new Date(connection.updatedAt).toLocaleDateString()}
          </Text>
        </Stack>

        <Flex gap="sm">
          <Link to="/profile/$userId" params={{ userId: String(user.id) }}>
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Remove
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

export default ConnectionCard;
