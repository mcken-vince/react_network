import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingColor =
  | "gray-900"
  | "gray-800"
  | "gray-700"
  | "primary-600"
  | "white";

const LEVEL_STYLES: Record<HeadingLevel, string> = {
  1: "text-3xl md:text-4xl font-bold",
  2: "text-2xl md:text-3xl font-bold",
  3: "text-xl md:text-2xl font-semibold",
  4: "text-lg md:text-xl font-semibold",
  5: "text-base md:text-lg font-medium",
  6: "text-sm md:text-base font-medium",
};

const COLOR: Record<HeadingColor, string> = {
  "gray-900": "text-gray-900",
  "gray-800": "text-gray-800",
  "gray-700": "text-gray-700",
  "primary-600": "text-primary-600",
  white: "text-white",
};

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  color?: HeadingColor;
}

const Heading = ({
  level = 1,
  color = "gray-900",
  children,
  className,
  ...props
}: HeadingProps) => {
  const Tag: `h${HeadingLevel}` = `h${level}`;
  return (
    <Tag
      className={cn(COLOR[color], LEVEL_STYLES[level], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default Heading;
