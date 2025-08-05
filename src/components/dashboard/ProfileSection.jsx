import { Avatar, Card, UserInfo } from "../common";

/**
 * Profile section component displaying current user's profile
 * @param {object} user - Current logged-in user object
 * @param {string} title - Section title
 */
function ProfileSection({ user, title = "Your Profile" }) {
  return (
    <section className="flex flex-col">
      <h2 className="text-gray-800 mb-4 text-2xl font-semibold">{title}</h2>
      <Card className="p-6">
        <div className="flex items-center gap-5 md:flex-row flex-col md:text-left text-center">
          <Avatar 
            firstName={user.firstName} 
            lastName={user.lastName} 
            size="large" 
          />
          <UserInfo user={user} variant="detailed" />
        </div>
      </Card>
    </section>
  );
}

export default ProfileSection;
