const DIRECTION = { row: "flex-row", col: "flex-col" };
const ALIGN = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};
const JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};
const GAP = {
  none: "gap-0",
  xs: "gap-1",
  small: "gap-2",
  medium: "gap-4",
  large: "gap-6",
  xl: "gap-8",
};
GAP.sm = GAP.small;
GAP.md = GAP.medium;
GAP.lg = GAP.large;

/**
 * @param {'row'|'col'} direction
 * @param {'start'|'center'|'end'|'stretch'} align
 * @param {'start'|'center'|'end'|'between'|'around'} justify
 * @param {'none'|'xs'|'small'|'medium'|'large'|'xl'|'sm'|'md'|'lg'} gap
 */
export const Flex = ({
  direction = "row",
  align = "stretch",
  justify = "start",
  gap = "medium",
  wrap = false,
  children,
  className = "",
  ...props
}) => {
  const classes = [
    "flex",
    DIRECTION[direction] ?? DIRECTION.row,
    ALIGN[align] ?? ALIGN.stretch,
    JUSTIFY[justify] ?? JUSTIFY.start,
    GAP[gap] ?? GAP.medium,
    wrap ? "flex-wrap" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Flex;
