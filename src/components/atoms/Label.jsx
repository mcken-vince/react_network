/**
 * Label component for form labels
 * @param {string} htmlFor - The ID of the form element this label is for
 * @param {boolean} required - Whether the field is required
 * @param {ReactNode} children - Label text content
 * @param {string} className - Additional CSS classes
 */
export const Label = ({ 
  htmlFor,
  required = false,
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <label 
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 ${className}`} 
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export default Label;
