import { Calendar, MapPin } from "lucide-react";
import { ConnectionStatusButton } from "../connections";
import { useUserWithConnectionStatus } from "../../hooks/useUsers";
import { Card } from "../common";
import ProfilePosts from "./ProfilePosts";
import type { User } from "../../types";

interface ProfileViewProps {
  user: User;
  currentUser: User;
  isOwnProfile: boolean;
}

const ProfileView = ({ user, currentUser, isOwnProfile }: ProfileViewProps) => {
  const { data: userWithStatus } = useUserWithConnectionStatus(
    user.id,
    !isOwnProfile,
  );
  const connectionStatus = userWithStatus?.connectionStatus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="inline-flex w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full items-center justify-center text-4xl font-bold shadow-2xl border-4 border-white/30">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="mt-6 space-y-2">
              <h1 className="text-4xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-xl text-white/80">@{user.username}</p>
            </div>

            {/* Connection actions (edit is handled by ProfileHeader) */}
            {!isOwnProfile && (
              <div className="mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block">
                  <ConnectionStatusButton
                    targetUserId={user.id}
                    currentUserId={currentUser.id}
                    connectionStatus={connectionStatus}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {user.bio && (
              <Card padding="large" shadow="medium">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {user.bio}
                </p>
              </Card>
            )}

            <ProfilePosts
              userId={user.id}
              currentUserId={currentUser.id}
              isOwnProfile={isOwnProfile}
            />
          </div>

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
