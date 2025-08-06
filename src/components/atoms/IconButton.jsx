import Icon from './Icon';

/**
 * IconButton component for clickable icons
 * @param {string} icon - Icon name
 * @param {function} onClick - Click handler
 * @param {string} size - Button size
 * @param {string} variant - Button variant
 * @param {string} ariaLabel - Accessibility label
 * @param {string} className - Additional CSS classes
 */
export const IconButton = ({ 
  icon, 
  onClick, 
  size = 'medium',
  variant = 'ghost',
  ariaLabel,
  className = '',
  ...props 
}) => {
  const sizeStyles = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-3',
  };
  
  const variantStyles = {
    ghost: 'hover:bg-gray-100',
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
  };
  
  return (
    <button
      onClick={onClick}
      className={`rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      aria-label={ariaLabel || icon}
      {...props}
    >
      <Icon name={icon} size={size} />
    </button>
  );
};

export default IconButton;
