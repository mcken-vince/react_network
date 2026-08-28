import { forwardRef } from "react";

const VARIANT_STYLES = {
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

const SIZE_STYLES = {
  small: "px-3 py-2 text-sm min-h-[36px]",
  medium: "px-6 py-3 text-base min-h-[44px]",
  large: "px-8 py-4 text-lg min-h-[52px]",
};
// Short aliases used throughout the app
SIZE_STYLES.sm = SIZE_STYLES.small;
SIZE_STYLES.md = SIZE_STYLES.medium;
SIZE_STYLES.lg = SIZE_STYLES.large;

/**
 * @param {'primary'|'secondary'|'danger'|'ghost'|'outline'} variant
 * @param {'small'|'medium'|'large'|'sm'|'md'|'lg'} size
 */
const Button = forwardRef(
  (
    {
      variant = "primary",
      size = "medium",
      isLoading = false,
      loadingText = "Loading...",
      fullWidth = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 hover:shadow-lg inline-flex items-center justify-center gap-2";

    const classes = [
      baseStyles,
      VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary,
      SIZE_STYLES[size] ?? SIZE_STYLES.medium,
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? loadingText : children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
