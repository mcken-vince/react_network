import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type FlexDirection = "row" | "col";
export type FlexAlign = "start" | "center" | "end" | "stretch";
export type FlexJustify = "start" | "center" | "end" | "between" | "around";
export type FlexGap =
  | "none"
  | "xs"
  | "small"
  | "medium"
  | "large"
  | "xl"
  | "sm"
  | "md"
  | "lg";

const DIRECTION: Record<FlexDirection, string> = {
  row: "flex-row",
  col: "flex-col",
};

const ALIGN: Record<FlexAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const JUSTIFY: Record<FlexJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

const GAP: Record<FlexGap, string> = {
  none: "gap-0",
  xs: "gap-1",
  small: "gap-2",
  medium: "gap-4",
  large: "gap-6",
  xl: "gap-8",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  direction?: FlexDirection;
  align?: FlexAlign;
  justify?: FlexJustify;
  gap?: FlexGap;
  wrap?: boolean;
}

const Flex = ({
  direction = "row",
  align = "stretch",
  justify = "start",
  gap = "medium",
  wrap = false,
  children,
  className,
  ...props
}: FlexProps) => (
  <div
    className={cn(
      "flex",
      DIRECTION[direction],
      ALIGN[align],
      JUSTIFY[justify],
      GAP[gap],
      wrap && "flex-wrap",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export default Flex;
