import type { LabelHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = ({
  required = false,
  children,
  className,
  ...props
}: LabelProps) => (
  <label
    className={cn("block text-sm font-medium text-gray-700", className)}
    {...props}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

export default Label;
