import { Avatar, Card, UserInfo } from "../common";
import { Flex, Stack } from "../atoms";
import { ConnectionStatusButton } from "../connections";

/**
 * UserCard component for displaying individual user information
 * @param {object} user - User object containing user details
 * @param {object} currentUser - Current logged-in user (optional)
 * @param {function} onClick - Optional click handler
 * @param {boolean} hoverable - Whether the card should have hover effects
 * @param {boolean} showConnectionStatus - Whether to show connection status button
 */
function UserCard({
  user,
  currentUser,
  onClick,
  hoverable = true,
  showConnectionStatus = false,
}) {
  const handleClick = () => {
    if (onClick) {
      onClick(user);
    }
  };

  return (
    <Card hoverable={hoverable} onClick={handleClick}>
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
          <Flex justify="center">
            <ConnectionStatusButton
              targetUserId={user.id}
              currentUserId={currentUser.id}
            />
          </Flex>
        )}
      </Stack>
    </Card>
  );
}

export default UserCard;
