import { forwardRef } from 'react';

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
const Button = forwardRef(({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  loadingText = 'Loading...',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };
  
  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg',
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';
  
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
});

Button.displayName = 'Button';

export default Button;
