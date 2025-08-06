/**
 * Container component for consistent max-width and padding
 * @param {string} size - Container max-width: 'small', 'medium', 'large', 'full'
 * @param {boolean} centered - Whether to center the container
 * @param {string} padding - Padding size: 'none', 'small', 'medium', 'large'
 * @param {ReactNode} children - Container content
 * @param {string} className - Additional CSS classes
 */
export const Container = ({ 
  size = 'large',
  centered = true,
  padding = 'medium',
  children, 
  className = '', 
  ...props 
}) => {
  const sizeStyles = {
    small: 'max-w-2xl',
    medium: 'max-w-4xl',
    large: 'max-w-6xl',
    full: 'max-w-full',
  };
  
  const paddingStyles = {
    none: 'p-0',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };
  
  const centerStyle = centered ? 'mx-auto' : '';
  
  return (
    <div 
      className={`${sizeStyles[size]} ${paddingStyles[padding]} ${centerStyle} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
