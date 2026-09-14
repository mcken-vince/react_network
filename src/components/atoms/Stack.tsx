import type { ElementType, HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type StackSpacing =
  | "xs"
  | "small"
  | "medium"
  | "large"
  | "xl"
  | "sm"
  | "md"
  | "lg";

const SPACING: Record<StackSpacing, string> = {
  xs: "space-y-1",
  small: "space-y-2",
  medium: "space-y-4",
  large: "space-y-6",
  xl: "space-y-8",
  sm: "space-y-2",
  md: "space-y-4",
  lg: "space-y-6",
};

interface StackProps extends HTMLAttributes<HTMLElement> {
  spacing?: StackSpacing;
  /** HTML element to render. */
  as?: ElementType;
}

/** Vertical stack with consistent spacing. */
const Stack = ({
  spacing = "medium",
  as: Component = "div",
  children,
  className,
  ...props
}: StackProps) => (
  <Component className={cn(SPACING[spacing], className)} {...props}>
    {children}
  </Component>
);

export default Stack;
