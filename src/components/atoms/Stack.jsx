const SPACING_STYLES = {
  xs: "space-y-1",
  small: "space-y-2",
  medium: "space-y-4",
  large: "space-y-6",
  xl: "space-y-8",
};
SPACING_STYLES.sm = SPACING_STYLES.small;
SPACING_STYLES.md = SPACING_STYLES.medium;
SPACING_STYLES.lg = SPACING_STYLES.large;

/**
 * Vertical stack with consistent spacing.
 * @param {'xs'|'small'|'medium'|'large'|'xl'|'sm'|'md'|'lg'} spacing
 * @param {string} as - HTML element to render
 */
const Stack = ({
  spacing = "medium",
  as = "div",
  children,
  className = "",
  ...props
}) => {
  const Component = as;
  const spacingClass = SPACING_STYLES[spacing] ?? SPACING_STYLES.medium;

  return (
    <Component className={`${spacingClass} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export default Stack;
