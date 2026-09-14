import { Heading, Stack, Text } from "../atoms";
import type { StackSpacing } from "../atoms/Stack";
import type { User } from "../../types";

export type UserInfoVariant = "compact" | "detailed";

/** Works for both full Users and embedded UserSummary objects. */
type UserInfoUser = Pick<User, "firstName" | "lastName" | "username"> & {
  location?: string;
  age?: number;
};

interface UserInfoProps {
  user: UserInfoUser;
  variant?: UserInfoVariant;
  className?: string;
}

const SPACING: Record<UserInfoVariant, StackSpacing> = {
  compact: "small",
  detailed: "medium",
};

function UserInfo({ user, variant = "compact", className }: UserInfoProps) {
  const { firstName, lastName, username, location, age } = user;

  return (
    <Stack spacing={SPACING[variant]} className={className}>
      <Heading
        level={variant === "detailed" ? 3 : 4}
        color="gray-800"
        className="m-0"
      >
        {firstName} {lastName}
      </Heading>
      <Text size="sm" color="gray-600" className="my-0">
        @{username}
      </Text>
      {location && (
        <Text size="sm" color="gray-600" className="my-0">
          📍 {location}
        </Text>
      )}
      {variant === "detailed" && age !== undefined && (
        <Text size="sm" color="gray-600" className="my-0">
          🎂 {age} years old
        </Text>
      )}
    </Stack>
  );
}

export default UserInfo;
