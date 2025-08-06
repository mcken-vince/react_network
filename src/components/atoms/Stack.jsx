/**
 * Stack component for vertical spacing
 * @param {string} spacing - Space between items: 'small', 'medium', 'large'
 * @param {string} as - HTML element to render (default: 'div')
 * @param {ReactNode} children - Stack items
 * @param {string} className - Additional CSS classes
 */
export const Stack = ({ spacing = 'medium', as = 'div', children, className = '', ...props }) => {
  const spacingStyles = {
    small: 'space-y-2',
    medium: 'space-y-4',
    large: 'space-y-6',
  };
  
  const Component = as;
  
  return (
    <Component className={`${spacingStyles[spacing]} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export default Stack;
