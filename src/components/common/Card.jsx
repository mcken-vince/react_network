import { forwardRef } from "react";

/**
 * Reusable Card component for consistent card styling
 * @param {ReactNode} children - Content to be displayed in the card
 * @param {string} className - Additional CSS classes
 * @param {boolean} hoverable - Whether the card should have hover effects
 * @param {function} onClick - Optional click handler
 */
const Card = forwardRef(
  (
    {
      children,
      hoverable = false,
      padding = "medium",
      shadow = "default",
      className = "",
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "bg-white rounded-2xl border border-gray-100 transition-all duration-200";

    const paddingStyles = {
      none: "",
      small: "p-4",
      medium: "p-6",
      large: "p-8",
    };

    const shadowStyles = {
      none: "",
      default: "shadow-sm",
      medium: "shadow-md",
      large: "shadow-lg shadow-gray-200/50",
    };

    const hoverStyles = hoverable
      ? "hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-1 cursor-pointer"
      : "";

    return (
      <div
        ref={ref}
        className={`
        ${baseStyles}
        ${paddingStyles[padding]}
        ${shadowStyles[shadow]}
        ${hoverStyles}
        ${className}
      `.trim()}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export default Card;
