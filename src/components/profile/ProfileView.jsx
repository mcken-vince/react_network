import { Card } from "../common";

/**
 * Profile view component for displaying user information
 * @param {object} user - The user whose profile is being viewed
 * @param {boolean} isOwnProfile - Whether the current user is viewing their own profile
 */
function ProfileView({ user, isOwnProfile }) {
  const { firstName, lastName, username, age, location } = user;

  return (
    <div>
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Information</h2>

        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-3">
            <label className="text-sm font-medium text-gray-500">First Name</label>
            <p className="mt-1 text-gray-900">{firstName}</p>
          </div>

          <div className="border-b border-gray-200 pb-3">
            <label className="text-sm font-medium text-gray-500">Last Name</label>
            <p className="mt-1 text-gray-900">{lastName}</p>
          </div>

          <div className="border-b border-gray-200 pb-3">
            <label className="text-sm font-medium text-gray-500">Username</label>
            <p className="mt-1 text-gray-900">@{username}</p>
          </div>

          <div className="border-b border-gray-200 pb-3">
            <label className="text-sm font-medium text-gray-500">Age</label>
            <p className="mt-1 text-gray-900">{age} years old</p>
          </div>

          <div className="border-b border-gray-200 pb-3">
            <label className="text-sm font-medium text-gray-500">Location</label>
            <p className="mt-1 text-gray-900">{location}</p>
          </div>
        </div>

        {isOwnProfile && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              This is your profile. Other users can see this information.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ProfileView;
