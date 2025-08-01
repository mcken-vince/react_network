import { Avatar, Card, UserInfo } from "../common";
import "./UserCard.css";

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
    <Card 
      className="user-card" 
      hoverable={hoverable}
      onClick={handleClick}
    >
      <Avatar 
        firstName={user.firstName} 
        lastName={user.lastName} 
        size="medium" 
      />
      <UserInfo user={user} variant="compact" />
    </Card>
  );
}

export default UserCard;
