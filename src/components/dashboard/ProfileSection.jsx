import { Avatar, Card, UserInfo } from "../common";
import "./ProfileSection.css";

/**
 * Profile section component displaying current user's profile
 * @param {object} user - Current logged-in user object
 * @param {string} title - Section title
 */
function ProfileSection({ user, title = "Your Profile" }) {
  return (
    <section className="profile-section">
      <h2 className="section-title">{title}</h2>
      <Card className="card-profile">
        <div className="profile-content">
          <Avatar 
            firstName={user.firstName} 
            lastName={user.lastName} 
            size="large" 
          />
          <UserInfo user={user} variant="detailed" />
        </div>
      </Card>
    </section>
  );
}

export default ProfileSection;
