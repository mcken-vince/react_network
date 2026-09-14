import { Avatar } from "../common";
import { Button, Container, Flex, Heading, Icon, Text } from "../atoms";
import type { User } from "../../types";

interface ProfileHeaderProps {
  profileUser: User;
  isOwnProfile: boolean;
  isEditing: boolean;
  onEditToggle: () => void;
}

function ProfileHeader({
  profileUser,
  isOwnProfile,
  isEditing,
  onEditToggle,
}: ProfileHeaderProps) {
  const { firstName, lastName, username, location } = profileUser;

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
              <Heading level={2} className="mb-1">
                {firstName} {lastName}
              </Heading>
              <Text size="sm" color="gray-600">
                @{username}
              </Text>
              <Flex align="center" gap="small">
                <Icon name="location" size="small" />
                <Text size="sm" color="gray-600">
                  {location}
                </Text>
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
