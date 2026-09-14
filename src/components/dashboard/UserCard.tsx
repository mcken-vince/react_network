import { Avatar, Card, UserInfo } from "../common";
import { Flex, Stack } from "../atoms";
import { ConnectionStatusButton } from "../connections";
import type { ConnectionStatusInfo, User } from "../../types";

type CardUser = User & { connectionStatus?: ConnectionStatusInfo | null };

interface UserCardProps {
  user: CardUser;
  /** Required when `showConnectionStatus` is set. */
  currentUser?: User;
  onClick?: (user: CardUser) => void;
  hoverable?: boolean;
  showConnectionStatus?: boolean;
}

function UserCard({
  user,
  currentUser,
  onClick,
  hoverable = true,
  showConnectionStatus = false,
}: UserCardProps) {
  return (
    <Card
      hoverable={hoverable}
      onClick={onClick ? () => onClick(user) : undefined}
    >
      <Stack spacing="md">
        <Flex align="center" gap="medium">
          <Avatar
            firstName={user.firstName}
            lastName={user.lastName}
            size="medium"
          />
          <UserInfo user={user} variant="compact" />
        </Flex>

        {showConnectionStatus && currentUser && (
          <Flex justify="center" onClick={(e) => e.stopPropagation()}>
            <ConnectionStatusButton
              targetUserId={user.id}
              currentUserId={currentUser.id}
              connectionStatus={user.connectionStatus}
            />
          </Flex>
        )}
      </Stack>
    </Card>
  );
}

export default UserCard;
