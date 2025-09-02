import { forwardRef } from "react";

/**
 * Reusable Button component with different variants and sizes
 * @param {string} variant - Button style variant: 'primary', 'secondary', 'danger', 'ghost'
 * @param {string} size - Button size: 'small', 'medium', 'large'
 * @param {boolean} isLoading - Shows loading state
 * @param {string} loadingText - Text to show during loading
 * @param {boolean} fullWidth - Whether button should take full width
 * @param {ReactNode} children - Button content
 * @param {string} className - Additional CSS classes
 * @param {object} props - Additional button props
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
    ref
  ) => {
    const baseStyles = `
    font-medium rounded-xl transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed
    transform active:scale-95 hover:shadow-lg
    inline-flex items-center justify-center gap-2
  `;

    const variantStyles = {
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

    const sizeStyles = {
      small: "px-3 py-2 text-sm min-h-[36px]",
      medium: "px-6 py-3 text-base min-h-[44px]",
      large: "px-8 py-4 text-lg min-h-[52px]",
    };

    const widthStyles = fullWidth ? "w-full" : "";

    const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${widthStyles}
    ${className}
  `.trim();

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? loadingText : children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
