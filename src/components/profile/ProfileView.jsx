import { Card } from "../common";
import "./ProfileView.css";

/**
 * Profile view component for displaying user information
 * @param {object} user - The user whose profile is being viewed
 * @param {boolean} isOwnProfile - Whether the current user is viewing their own profile
 */
function ProfileView({ user, isOwnProfile }) {
  const { firstName, lastName, username, age, location } = user;

  return (
    <div className="profile-view">
      <Card className="profile-info-card">
        <h2>Profile Information</h2>

        <div className="profile-field">
          <label>First Name</label>
          <p>{firstName}</p>
        </div>

        <div className="profile-field">
          <label>Last Name</label>
          <p>{lastName}</p>
        </div>

        <div className="profile-field">
          <label>Username</label>
          <p>@{username}</p>
        </div>

        <div className="profile-field">
          <label>Age</label>
          <p>{age} years old</p>
        </div>

        <div className="profile-field">
          <label>Location</label>
          <p>{location}</p>
        </div>

        {isOwnProfile && (
          <div className="profile-note">
            <p>This is your profile. Other users can see this information.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ProfileView;
