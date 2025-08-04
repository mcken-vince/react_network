import { useState } from "react";
import { Link } from "@tanstack/react-router";
import ProfileHeader from "./ProfileHeader";
import ProfileView from "./ProfileView";
import ProfileEdit from "./ProfileEdit";
import "./ProfilePage.css";

/**
 * Main profile page component that handles both viewing and editing profiles
 * @param {object} profileUser - The user whose profile is being viewed
 * @param {object} currentUser - The currently logged-in user
 * @param {boolean} isOwnProfile - Whether the current user is viewing their own profile
 */
function ProfilePage({ profileUser, currentUser, isOwnProfile }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditSave = () => {
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <ProfileHeader
        profileUser={profileUser}
        isOwnProfile={isOwnProfile}
        isEditing={isEditing}
        onEditToggle={handleEditToggle}
      />

      <main className="profile-content">
        <div className="profile-container">
          <nav className="profile-nav">
            <Link to="/dashboard" className="back-link">
              ← Back to Dashboard
            </Link>
          </nav>

          {isEditing ? (
            <ProfileEdit
              user={profileUser}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
            />
          ) : (
            <ProfileView user={profileUser} isOwnProfile={isOwnProfile} />
          )}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
