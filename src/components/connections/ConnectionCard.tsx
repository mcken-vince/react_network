import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "../common";
import { Button, Flex, Icon, Stack, Text } from "../atoms";
import type { Connection } from "../../types";

interface ConnectionCardProps {
  connection: Connection;
  currentUserId: number;
  highlighted?: boolean;
  onRemove: () => void;
}

const ConnectionCard = ({
  connection,
  currentUserId,
  highlighted = false,
  onRemove,
}: ConnectionCardProps) => {
  const user =
    connection.requesterId === currentUserId
      ? connection.recipient
      : connection.requester;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  if (!user) return null;

  return (
    <div
      ref={ref}
      className={
        highlighted
          ? "rounded-2xl ring-2 ring-blue-400 ring-offset-2"
          : undefined
      }
    >
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
              <Text size="sm" color="muted" className="flex items-center gap-1">
                <Icon name="location" size="small" className="h-3.5 w-3.5" />
                {user.location}
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
    </div>
  );
};

export default ConnectionCard;
