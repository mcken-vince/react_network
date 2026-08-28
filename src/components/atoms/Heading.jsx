const LEVEL_STYLES = {
  1: "text-3xl md:text-4xl font-bold",
  2: "text-2xl md:text-3xl font-bold",
  3: "text-xl md:text-2xl font-semibold",
  4: "text-lg md:text-xl font-semibold",
  5: "text-base md:text-lg font-medium",
  6: "text-sm md:text-base font-medium",
};

const COLOR = {
  "gray-900": "text-gray-900",
  "gray-800": "text-gray-800",
  "gray-700": "text-gray-700",
  "primary-600": "text-primary-600",
  white: "text-white",
};

/**
 * @param {1|2|3|4|5|6} level
 * @param {keyof COLOR} color
 */
export const Heading = ({
  level = 1,
  children,
  className = "",
  color = "gray-900",
  ...props
}) => {
  const safeLevel = LEVEL_STYLES[level] ? level : 1;
  const Tag = `h${safeLevel}`;

  return (
    <Tag
      className={`${COLOR[color] ?? COLOR["gray-900"]} ${LEVEL_STYLES[safeLevel]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default Heading;
