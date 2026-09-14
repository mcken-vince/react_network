import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "outline";
export type ButtonSize = "small" | "medium" | "large" | "sm" | "md" | "lg";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 shadow-md",
  secondary:
    "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
  danger:
    "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 focus:ring-red-500 shadow-md",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500 hover:text-gray-800",
  outline:
    "bg-transparent border-2 border-current hover:bg-current hover:text-white focus:ring-current",
};

const SMALL = "px-3 py-2 text-sm min-h-[36px]";
const MEDIUM = "px-6 py-3 text-base min-h-[44px]";
const LARGE = "px-8 py-4 text-lg min-h-[52px]";

const SIZE_STYLES: Record<ButtonSize, string> = {
  small: SMALL,
  medium: MEDIUM,
  large: LARGE,
  sm: SMALL,
  md: MEDIUM,
  lg: LARGE,
};

const BASE =
  "font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 hover:shadow-lg inline-flex items-center justify-center gap-2";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      isLoading = false,
      loadingText = "Loading...",
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        BASE,
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  ),
);
Button.displayName = "Button";

export default Button;
