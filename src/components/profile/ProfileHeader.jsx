import { Avatar } from "../common";

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
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-5">
          <Avatar firstName={firstName} lastName={lastName} size="large" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{fullName}</h1>
            <p className="text-gray-600 text-sm">@{username}</p>
            <p className="text-gray-600 text-sm">📍 {location}</p>
          </div>
        </div>

        {isOwnProfile && (
          <div>
            <button
              onClick={onEditToggle}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                isEditing
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-primary-600 text-white hover:bg-primary-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isEditing ? "focus:ring-gray-500" : "focus:ring-primary-500"
              }`}
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
