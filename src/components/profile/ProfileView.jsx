import React from "react";
import { MapPin, Calendar, UserPlus, Edit, Loader2 } from "lucide-react";
import { ConnectionStatusButton } from "../connections";

const ProfileView = ({ user, currentUser, isOwnProfile = false }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section with Gradient Background */}
      <div className="relative">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-blue-500 to-purple-600"></div>

        {/* Profile Picture Placeholder */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-16">
          <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-3xl font-semibold text-gray-600">
                {user.firstName[0]}
                {user.lastName[0]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pt-20 pb-8 max-w-2xl mx-auto">
        {/* Name and Username Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-lg text-gray-600">@{user.username}</p>
          {user.tag && (
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              {user.tag}
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-8">
          {isOwnProfile ? (
            <button className="flex items-center gap-2 px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full font-medium transition-colors">
              <Edit size={18} />
              Edit Profile
            </button>
          ) : (
            // <button className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors shadow-md">
            //   <UserPlus size={18} />
            //   Connect
            // </button>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg flex justify-center">
              <ConnectionStatusButton
                targetUserId={user.id}
                currentUserId={currentUser.id}
              />
            </div>
          )}
        </div>

        {/* Info Cards Section */}
        <div className="space-y-4">
          {/* Personal Information Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Personal Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="text-gray-900 font-medium">{user.age}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-gray-900 font-medium">{user.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* About/Bio Section */}
          {user.bio && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                About
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {user.bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
