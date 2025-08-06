/**
 * Icon component for displaying inline icons
 * @param {string} name - Icon name
 * @param {string} size - Icon size: 'small', 'medium', 'large'
 * @param {string} color - Icon color
 * @param {string} className - Additional CSS classes
 */
export const Icon = ({ name, size = 'medium', color = 'current', className = '', ...props }) => {
  const sizeStyles = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };
  
  const colorStyles = color === 'current' ? '' : `text-${color}`;
  
  // Simple icons using emoji or Unicode for now
  // In a real app, you'd use an icon library like react-icons or heroicons
  const icons = {
    location: '📍',
    user: '👤',
    edit: '✏️',
    close: '❌',
    check: '✓',
    warning: '⚠️',
    info: 'ℹ️',
  };
  
  return (
    <span 
      className={`inline-block ${sizeStyles[size]} ${colorStyles} ${className}`}
      aria-label={name}
      {...props}
    >
      {icons[name] || '?'}
    </span>
  );
};

export default Icon;
