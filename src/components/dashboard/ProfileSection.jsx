import { Avatar, Card, UserInfo } from "../common";
import { Heading, Flex, Stack } from "../atoms";

/**
 * Profile section component displaying current user's profile
 * @param {object} user - Current logged-in user object
 * @param {string} title - Section title
 */
function ProfileSection({ user, title = "Your Profile" }) {
  return (
    <Stack as="section" spacing="medium">
      <Heading level={2} color="gray-800" className="mb-0">
        {title}
      </Heading>
      <Card className="p-6">
        <Flex 
          direction="col" 
          align="center"
          gap="large"
          className="md:flex-row md:items-center md:text-left text-center"
        >
          <Avatar 
            firstName={user.firstName} 
            lastName={user.lastName} 
            size="large" 
          />
          <UserInfo user={user} variant="detailed" />
        </Flex>
      </Card>
    </Stack>
  );
}

export default ProfileSection;
