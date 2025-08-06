import { Link } from "@tanstack/react-router";
import { Card } from "../common";
import { Button, Flex, Text, Stack } from "../atoms";

const ConnectionCard = ({ connection, onRemove }) => {
  const user = connection.connectedUser;

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
          <Link to="/profile/$userId" params={{ userId: user.id.toString() }}>
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
