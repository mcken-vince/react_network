/**
 * Section component for page sections with consistent spacing
 * @param {string} spacing - Vertical spacing: 'small', 'medium', 'large'
 * @param {string} background - Background color
 * @param {ReactNode} children - Section content
 * @param {string} className - Additional CSS classes
 */
export const Section = ({ 
  spacing = 'medium',
  background = 'transparent',
  children, 
  className = '', 
  ...props 
}) => {
  const spacingStyles = {
    small: 'py-4',
    medium: 'py-8',
    large: 'py-12',
  };
  
  const bgStyle = background === 'transparent' ? '' : `bg-${background}`;
  
  return (
    <section 
      className={`${spacingStyles[spacing]} ${bgStyle} ${className}`} 
      {...props}
    >
      {children}
    </section>
  );
};

export default Section;
