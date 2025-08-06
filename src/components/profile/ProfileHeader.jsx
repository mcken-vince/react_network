import { Avatar } from "../common";
import { Button, Container, Flex, Heading, Text, Icon } from "../atoms";

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
      <Container size="large">
        <Flex 
          direction="row" 
          justify="between" 
          align="center" 
          gap="medium"
          className="flex-col md:flex-row items-start md:items-center"
        >
          <Flex align="center" gap="medium">
            <Avatar firstName={firstName} lastName={lastName} size="large" />
            <div>
              <Heading level={2} className="mb-1">{fullName}</Heading>
              <Text size="sm" color="gray-600">@{username}</Text>
              <Flex align="center" gap="small">
                <Icon name="location" size="small" />
                <Text size="sm" color="gray-600">{location}</Text>
              </Flex>
            </div>
          </Flex>

          {isOwnProfile && (
            <Button
              onClick={onEditToggle}
              variant={isEditing ? "secondary" : "primary"}
              size="medium"
            >
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </Button>
          )}
        </Flex>
      </Container>
    </header>
  );
}

export default ProfileHeader;
