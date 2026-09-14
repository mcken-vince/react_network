import type {
  ChangeEvent,
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Input, Label, Stack, Text } from "../../atoms";
import { cn } from "../../../lib/cn";

type FieldElement = HTMLInputElement | HTMLTextAreaElement;

type NativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "type" | "value" | "onChange" | "size" | "className" | "placeholder" | "required"
>;

interface FormFieldProps extends NativeProps {
  label: string;
  name: string;
  type?: HTMLInputTypeAttribute;
  value: string;
  onChange: (e: ChangeEvent<FieldElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  /** Render a <textarea> instead of an <input>. */
  multiline?: boolean;
  rows?: number;
  helperText?: string;
  /** Extra classes for the input element. */
  className?: string;
}

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
  className,
  ...props
}: FormFieldProps) {
  const errorId = error ? `${name}-error` : undefined;

  const inputElement = multiline ? (
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        "w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical",
        error
          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
          : "border-gray-300 hover:border-gray-400",
        className,
      )}
      aria-invalid={Boolean(error)}
      aria-describedby={errorId}
      // Shared HTML attributes (autoComplete, maxLength, ...) apply to both.
      {...(props as unknown as TextareaHTMLAttributes<HTMLTextAreaElement>)}
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
      aria-invalid={Boolean(error)}
      aria-describedby={errorId}
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
        <Text id={errorId} size="sm" color="red-500" className="mt-1" role="alert">
          {error}
        </Text>
      )}
    </Stack>
  );
}

export default FormField;