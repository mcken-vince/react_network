import { useState } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileView from "./ProfileView";
import ProfileEdit from "./ProfileEdit";

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
    <div className="min-h-screen bg-slate-50">
      <ProfileHeader
        profileUser={profileUser}
        isOwnProfile={isOwnProfile}
        isEditing={isEditing}
        onEditToggle={handleEditToggle}
      />

      <main className="p-6">
        <div className="max-w-3xl mx-auto">
          {isEditing ? (
            <ProfileEdit
              user={profileUser}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
            />
          ) : (
            <ProfileView
              user={profileUser}
              currentUser={currentUser}
              isOwnProfile={isOwnProfile}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
