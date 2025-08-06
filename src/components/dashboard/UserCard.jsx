import { Avatar, Card, UserInfo } from "../common";
import { Flex } from "../atoms";

/**
 * UserCard component for displaying individual user information
 * @param {object} user - User object containing user details
 * @param {function} onClick - Optional click handler
 * @param {boolean} hoverable - Whether the card should have hover effects
 */
function UserCard({ user, onClick, hoverable = true }) {
  const handleClick = () => {
    if (onClick) {
      onClick(user);
    }
  };

  return (
    <Card hoverable={hoverable} onClick={handleClick}>
      <Flex align="center" gap="medium">
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          size="medium"
        />
        <UserInfo user={user} variant="compact" />
      </Flex>
    </Card>
  );
}

export default UserCard;
