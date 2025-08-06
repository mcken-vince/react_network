/**
 * Heading component for consistent header styling
 * @param {number} level - Heading level (1-6)
 * @param {ReactNode} children - Content to display
 * @param {string} className - Additional CSS classes
 * @param {string} color - Text color class
 */
export const Heading = ({ 
  level = 1, 
  children, 
  className = '', 
  color = 'gray-900',
  ...props 
}) => {
  const Tag = `h${level}`;
  
  const styles = {
    1: 'text-3xl md:text-4xl font-bold',
    2: 'text-2xl md:text-3xl font-bold',
    3: 'text-xl md:text-2xl font-semibold',
    4: 'text-lg md:text-xl font-semibold',
    5: 'text-base md:text-lg font-medium',
    6: 'text-sm md:text-base font-medium',
  };
  
  return (
    <Tag 
      className={`text-${color} ${styles[level]} ${className}`} 
      {...props}
    >
      {children}
    </Tag>
  );
};

export default Heading;
