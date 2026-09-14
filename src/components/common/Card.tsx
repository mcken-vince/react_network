import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type CardPadding = "none" | "small" | "medium" | "large";
export type CardShadow = "none" | "default" | "medium" | "large";

const PADDING: Record<CardPadding, string> = {
  none: "",
  small: "p-4",
  medium: "p-6",
  large: "p-8",
};

const SHADOW: Record<CardShadow, string> = {
  none: "",
  default: "shadow-sm",
  medium: "shadow-md",
  large: "shadow-lg shadow-gray-200/50",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: CardPadding;
  shadow?: CardShadow;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      hoverable = false,
      padding = "medium",
      shadow = "default",
      className,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-2xl border border-gray-100 transition-all duration-200",
        PADDING[padding],
        SHADOW[shadow],
        hoverable &&
          "hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-1 cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = "Card";

export default Card;
