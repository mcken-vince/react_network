import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type ContainerSize = "small" | "medium" | "large" | "full";
export type ContainerPadding = "none" | "small" | "medium" | "large";

const SIZE: Record<ContainerSize, string> = {
  small: "max-w-2xl",
  medium: "max-w-4xl",
  large: "max-w-6xl",
  full: "max-w-full",
};

const PADDING: Record<ContainerPadding, string> = {
  none: "p-0",
  small: "p-4",
  medium: "p-6",
  large: "p-8",
};

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  centered?: boolean;
  padding?: ContainerPadding;
}

const Container = ({
  size = "large",
  centered = true,
  padding = "medium",
  children,
  className,
  ...props
}: ContainerProps) => (
  <div
    className={cn(
      SIZE[size],
      PADDING[padding],
      centered && "mx-auto",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export default Container;
