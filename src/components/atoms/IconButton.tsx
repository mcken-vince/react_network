import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import Icon, { type IconName, type IconSize } from "./Icon";

export type IconButtonVariant = "ghost" | "primary" | "secondary";

const SIZE: Record<IconSize, string> = {
  small: "p-1",
  medium: "p-2",
  large: "p-3",
};

const VARIANT: Record<IconButtonVariant, string> = {
  ghost: "hover:bg-gray-100",
  primary: "bg-primary-600 text-white hover:bg-primary-700",
  secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300",
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  size?: IconSize;
  variant?: IconButtonVariant;
  ariaLabel?: string;
}

const IconButton = ({
  icon,
  size = "medium",
  variant = "ghost",
  ariaLabel,
  className,
  type = "button",
  ...props
}: IconButtonProps) => (
  <button
    type={type}
    className={cn(
      "rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
      VARIANT[variant],
      SIZE[size],
      className,
    )}
    aria-label={ariaLabel ?? icon}
    {...props}
  >
    <Icon name={icon} size={size} />
  </button>
);

export default IconButton;
