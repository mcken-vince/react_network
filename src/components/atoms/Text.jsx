/**
 * Text component for consistent text styling
 * @param {string} size - Text size: 'xs', 'sm', 'base', 'lg', 'xl'
 * @param {string} color - Text color class
 * @param {string} weight - Font weight: 'normal', 'medium', 'semibold', 'bold'
 * @param {ReactNode} children - Content to display
 * @param {string} className - Additional CSS classes
 */
export const Text = ({ 
  size = 'base', 
  color = 'gray-700', 
  weight = 'normal',
  children, 
  className = '', 
  ...props 
}) => {
  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  
  const weightStyles = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };
  
  return (
    <p 
      className={`text-${color} ${sizeStyles[size]} ${weightStyles[weight]} ${className}`} 
      {...props}
    >
      {children}
    </p>
  );
};

export default Text;
