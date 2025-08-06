/**
 * Grid layout component for consistent spacing and responsive layouts
 * @param {number} cols - Number of columns (1-12)
 * @param {number} mdCols - Number of columns on medium screens and up
 * @param {number} lgCols - Number of columns on large screens and up
 * @param {string} gap - Gap size: 'none', 'small', 'medium', 'large'
 * @param {ReactNode} children - Grid items
 * @param {string} className - Additional CSS classes
 */
export const Grid = ({ 
  cols = 1, 
  mdCols, 
  lgCols,
  gap = 'medium', 
  children, 
  className = '', 
  ...props 
}) => {
  const gapStyles = {
    none: 'gap-0',
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  };
  
  const colStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };
  
  const mdColStyles = mdCols ? {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
    12: 'md:grid-cols-12',
  }[mdCols] : '';
  
  const lgColStyles = lgCols ? {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    12: 'lg:grid-cols-12',
  }[lgCols] : '';
  
  return (
    <div 
      className={`grid ${colStyles[cols]} ${mdColStyles} ${lgColStyles} ${gapStyles[gap]} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export default Grid;
