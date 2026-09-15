import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { TEXT_COLORS, type TextColor } from "./colors";

export type TextSize = "xs" | "sm" | "base" | "lg" | "xl";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";

const SIZE: Record<TextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

const WEIGHT: Record<TextWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  size?: TextSize;
  color?: TextColor;
  weight?: TextWeight;
}

const Text = ({
  size = "base",
  color = "gray-700",
  weight = "normal",
  children,
  className,
  ...props
}: TextProps) => (
  <p
    className={cn(TEXT_COLORS[color], SIZE[size], WEIGHT[weight], className)}
    {...props}
  >
    {children}
  </p>
);

export default Text;
