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
  className = "",
  ...props
}) {
  return (
    <Stack spacing="small" className="w-full">
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        variant={error ? 'error' : 'default'}
        fullWidth
        className={className}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      
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
