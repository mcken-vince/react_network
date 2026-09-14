import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 12;
export type GridGap = "none" | "small" | "medium" | "large";

const COLS: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12",
};

const MD_COLS: Record<GridCols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  12: "md:grid-cols-12",
};

const LG_COLS: Record<GridCols, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  12: "lg:grid-cols-12",
};

const GAP: Record<GridGap, string> = {
  none: "gap-0",
  small: "gap-2",
  medium: "gap-4",
  large: "gap-6",
};

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: GridCols;
  mdCols?: GridCols;
  lgCols?: GridCols;
  gap?: GridGap;
}

const Grid = ({
  cols = 1,
  mdCols,
  lgCols,
  gap = "medium",
  children,
  className,
  ...props
}: GridProps) => (
  <div
    className={cn(
      "grid",
      COLS[cols],
      mdCols && MD_COLS[mdCols],
      lgCols && LG_COLS[lgCols],
      GAP[gap],
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export default Grid;
