/**
 * Input component for consistent form input styling
 * @param {string} type - Input type (text, password, email, etc.)
 * @param {string} variant - Visual variant: 'default', 'error', 'success'
 * @param {string} size - Input size: 'small', 'medium', 'large'
 * @param {boolean} fullWidth - Whether input should take full width
 * @param {string} className - Additional CSS classes
 */
export const Input = ({ 
  type = 'text',
  variant = 'default',
  size = 'medium',
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = `
    px-3 py-2 
    border rounded-lg
    text-gray-900 placeholder-gray-500
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
  `;

  const variantStyles = {
    default: 'border-gray-300 hover:border-gray-400',
    error: 'border-red-500 focus:ring-red-500 focus:border-red-500',
    success: 'border-green-500 focus:ring-green-500 focus:border-green-500',
  };

  const sizeStyles = {
    small: 'text-sm px-2 py-1',
    medium: 'text-base px-3 py-2',
    large: 'text-lg px-4 py-3',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <input
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    />
  );
};

export default Input;
