import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "../common";
import { Button, Flex, Stack, Text } from "../atoms";
import type { Connection } from "../../types";

interface ConnectionRequestCardProps {
  request: Connection;
  isSentRequest?: boolean;
  highlighted?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

const ConnectionRequestCard = ({
  request,
  isSentRequest = false,
  highlighted = false,
  onAccept,
  onReject,
  onCancel,
}: ConnectionRequestCardProps) => {
  const user = isSentRequest ? request.recipient : request.requester;
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
              <Text size="sm" color="muted">
                📍 {user.location}
              </Text>
            )}
            <Text size="xs" color="muted">
              {isSentRequest ? "Request sent" : "Wants to connect"} •{" "}
              {new Date(request.createdAt).toLocaleDateString()}
            </Text>
          </Stack>
          <Flex gap="sm">
            <Link to="/profile/$userId" params={{ userId: String(user.id) }}>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </Link>
            {isSentRequest ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReject}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Decline
                </Button>
                <Button variant="primary" size="sm" onClick={onAccept}>
                  Accept
                </Button>
              </>
            )}
          </Flex>
        </Flex>
      </Card>
    </div>
  );
};

export default ConnectionRequestCard;
