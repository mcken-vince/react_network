import { Avatar } from "../common";
import "./ProfileHeader.css";

/**
 * Profile header component with user's basic info and edit button
 * @param {object} profileUser - The user whose profile is being viewed
 * @param {boolean} isOwnProfile - Whether the current user is viewing their own profile
 * @param {boolean} isEditing - Whether the profile is in edit mode
 * @param {function} onEditToggle - Function to toggle edit mode
 */
function ProfileHeader({ profileUser, isOwnProfile, isEditing, onEditToggle }) {
  const { firstName, lastName, username, location } = profileUser;
  const fullName = `${firstName} ${lastName}`;

  return (
    <header className="profile-header">
      <div className="profile-header-content">
        <div className="profile-header-info">
          <Avatar firstName={firstName} lastName={lastName} size="large" />
          <div className="profile-header-details">
            <h1 className="profile-name">{fullName}</h1>
            <p className="profile-username">@{username}</p>
            <p className="profile-location">📍 {location}</p>
          </div>
        </div>

        {isOwnProfile && (
          <div className="profile-header-actions">
            <button
              onClick={onEditToggle}
              className={`edit-profile-btn ${isEditing ? "editing" : ""}`}
            >
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default ProfileHeader;
