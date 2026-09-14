import { useState } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileView from "./ProfileView";
import ProfileEdit from "./ProfileEdit";
import type { User } from "../../types";

interface ProfilePageProps {
  profileUser: User;
  currentUser: User;
  isOwnProfile: boolean;
}

function ProfilePage({
  profileUser,
  currentUser,
  isOwnProfile,
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <ProfileHeader
        profileUser={profileUser}
        isOwnProfile={isOwnProfile}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing((editing) => !editing)}
      />

      <main className="p-6">
        <div className="max-w-3xl mx-auto">
          {isEditing ? (
            <ProfileEdit
              user={profileUser}
              onSave={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
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
