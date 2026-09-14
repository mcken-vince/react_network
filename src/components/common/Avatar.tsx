import { cn } from "../../lib/cn";

export type AvatarSize = "small" | "medium" | "large";

const SIZE: Record<AvatarSize, string> = {
  small: "w-10 h-10 text-sm",
  medium: "w-[50px] h-[50px] text-base",
  large: "w-20 h-20 text-2xl",
};

interface AvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  size?: AvatarSize;
  className?: string;
}

function Avatar({
  firstName,
  lastName,
  size = "medium",
  className,
}: AvatarProps) {
  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-bold flex-shrink-0",
        SIZE[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export default Avatar;
