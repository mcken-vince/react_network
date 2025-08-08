import { Label, Text, Input, Stack } from "../../atoms";

/**
 * Reusable form field component with label and error handling
 * @param {string} label - Field label text
 * @param {string} name - Field name attribute
 * @param {string} type - Input type (text, password, email, number, etc.)
 * @param {string} value - Field value
 * @param {function} onChange - Change handler
 * @param {string} error - Error message to display
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Whether field is required
 * @param {boolean} multiline - Whether to use textarea instead of input
 * @param {number} rows - Number of rows for textarea
 * @param {string} helperText - Additional helper text
 * @param {string} className - Additional CSS classes for the input
 * @param {object} props - Additional input props
 */
function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  multiline = false,
  rows = 3,
  helperText,
  className = "",
  ...props
}) {
  const inputElement = multiline ? (
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical ${
        error
          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
          : "border-gray-300 hover:border-gray-400"
      } ${className}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : undefined}
      {...props}
    />
  ) : (
    <Input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variant={error ? "error" : "default"}
      fullWidth
      className={className}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : undefined}
      {...props}
    />
  );
  return (
    <Stack spacing="small" className="w-full">
      <Label htmlFor={name} required={required}>
        {label}
      </Label>

      {inputElement}

      {helperText && !error && (
        <Text size="sm" color="gray-600" className="mt-1">
          {helperText}
        </Text>
      )}

      {error && (
        <Text
          id={`${name}-error`}
          size="sm"
          color="red-500"
          className="mt-1"
          role="alert"
        >
          {error}
        </Text>
      )}
    </Stack>
  );
}

export default FormField;
