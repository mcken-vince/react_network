import { Card } from "../common";
import { Button, Flex, Text, Stack } from "../atoms";

const ConnectionRequestCard = ({
  request,
  isSentRequest = false,
  onAccept,
  onReject,
  onCancel,
}) => {
  const user = isSentRequest ? request.recipient : request.requester;

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
            {isSentRequest ? "Request sent" : "Wants to connect"} •{" "}
            {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </Stack>

        <Flex gap="sm">
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
  );
};

export default ConnectionRequestCard;
