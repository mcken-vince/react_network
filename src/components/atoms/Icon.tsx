import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { TEXT_COLORS, type TextColor } from "./Text";

// Emoji/Unicode for now; swap for an icon library later without changing callers.
const ICONS = {
  location: "📍",
  user: "👤",
  edit: "✏️",
  close: "❌",
  check: "✓",
  warning: "⚠️",
  info: "ℹ️",
  menu: "☰",
  bell: "🔔",
  logout: "🚪",
  dashboard: "📊",
  connections: "🔗",
  notifications: "🔔",
  profile: "👤",
} as const;

export type IconName = keyof typeof ICONS;
export type IconSize = "small" | "medium" | "large";

const SIZE: Record<IconSize, string> = {
  small: "w-4 h-4",
  medium: "w-5 h-5",
  large: "w-6 h-6",
};

interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: IconName;
  size?: IconSize;
  /** "current" inherits the surrounding text colour. */
  color?: TextColor | "current";
}

const Icon = ({
  name,
  size = "medium",
  color = "current",
  className,
  ...props
}: IconProps) => (
  <span
    className={cn(
      "inline-block",
      SIZE[size],
      color !== "current" && TEXT_COLORS[color],
      className,
    )}
    aria-label={name}
    {...props}
  >
    {ICONS[name]}
  </span>
);

export default Icon;
