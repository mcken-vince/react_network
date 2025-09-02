import React from "react";
import { MapPin, Calendar, UserPlus, Edit, Loader2 } from "lucide-react";
import { ConnectionStatusButton } from "../connections";
import { useUserWithConnectionStatus } from "../../hooks/useUsers";
import { Button } from "../atoms";
import { Card } from "../common";

const ProfileView = ({ user, currentUser, isOwnProfile }) => {
  const { data: userWithStatus } = useUserWithConnectionStatus(
    user.id,
    !isOwnProfile
  );
  const connectionStatus = userWithStatus?.connectionStatus;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section with better visual hierarchy */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            {/* Enhanced Avatar */}
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl border-4 border-white/30">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
              {isOwnProfile && (
                <button className="absolute bottom-2 right-2 w-8 h-8 bg-white text-gray-600 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors">
                  <Edit size={16} />
                </button>
              )}
            </div>

            {/* User Info with better spacing */}
            <div className="mt-6 space-y-2">
              <h1 className="text-4xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-xl text-white/80">@{user.username}</p>
              {user.tag && (
                <p className="text-lg text-white/70 max-w-2xl mx-auto">
                  {user.tag}
                </p>
              )}
            </div>

            {/* Action buttons with better styling */}
            <div className="mt-8">
              {isOwnProfile ? (
                <Button
                  variant="secondary"
                  size="large"
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  <Edit size={20} />
                  Edit Profile
                </Button>
              ) : (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block">
                  <ConnectionStatusButton
                    targetUserId={user.id}
                    currentUserId={currentUser.id}
                    connectionStatus={connectionStatus}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content with better layout */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main info */}
          <div className="md:col-span-2 space-y-6">
            {user.bio && (
              <Card padding="large" shadow="medium">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {user.bio}
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card padding="large" shadow="medium">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-semibold text-gray-800">
                      {user.age} years old
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold text-gray-800">
                      {user.location}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
