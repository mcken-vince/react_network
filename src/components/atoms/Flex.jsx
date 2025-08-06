/**
 * Flex container component for flexible layouts
 * @param {string} direction - Flex direction: 'row', 'col'
 * @param {string} align - Align items: 'start', 'center', 'end', 'stretch'
 * @param {string} justify - Justify content: 'start', 'center', 'end', 'between', 'around'
 * @param {string} gap - Gap size: 'none', 'small', 'medium', 'large'
 * @param {boolean} wrap - Whether items should wrap
 * @param {ReactNode} children - Flex items
 * @param {string} className - Additional CSS classes
 */
export const Flex = ({ 
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  gap = 'medium',
  wrap = false,
  children, 
  className = '', 
  ...props 
}) => {
  const directionStyles = {
    row: 'flex-row',
    col: 'flex-col',
  };
  
  const alignStyles = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };
  
  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };
  
  const gapStyles = {
    none: 'gap-0',
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  };
  
  const wrapStyle = wrap ? 'flex-wrap' : '';
  
  return (
    <div 
      className={`flex ${directionStyles[direction]} ${alignStyles[align]} ${justifyStyles[justify]} ${gapStyles[gap]} ${wrapStyle} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export default Flex;
