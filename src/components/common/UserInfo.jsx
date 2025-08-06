import { Heading, Text, Stack } from "../atoms";

/**
 * Reusable UserInfo component for displaying user details
 * @param {object} user - User object containing user information
 * @param {string} variant - Display variant: 'compact' or 'detailed'
 * @param {string} className - Additional CSS classes
 */
function UserInfo({ user, variant = "compact", className = "" }) {
  const { firstName, lastName, username, location, age } = user;
  const fullName = `${firstName} ${lastName}`;

  const spacingByVariant = {
    compact: "small",
    detailed: "medium"
  };

  const headingLevel = variant === "detailed" ? 3 : 4;

  return (
    <Stack spacing={spacingByVariant[variant]} className={className}>
      <Heading 
        level={headingLevel} 
        color="gray-800" 
        className="m-0"
      >
        {fullName}
      </Heading>
      <Text size="sm" color="gray-600" className="my-0">
        @{username}
      </Text>
      <Text size="sm" color="gray-600" className="my-0">
        📍 {location}
      </Text>
      {variant === "detailed" && age && (
        <Text size="sm" color="gray-600" className="my-0">
          🎂 {age} years old
        </Text>
      )}
    </Stack>
  );
}

export default UserInfo;
