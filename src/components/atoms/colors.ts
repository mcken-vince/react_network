// Literal class names so Tailwind's scanner can see them. Add entries here
// rather than interpolating `text-${color}`.
export const TEXT_COLORS = {
  "gray-500": "text-gray-500",
  "gray-600": "text-gray-600",
  "gray-700": "text-gray-700",
  "gray-800": "text-gray-800",
  "gray-900": "text-gray-900",
  "primary-600": "text-primary-600",
  "primary-700": "text-primary-700",
  "red-500": "text-red-500",
  "red-600": "text-red-600",
  "red-700": "text-red-700",
  "green-600": "text-green-600",
  "green-700": "text-green-700",
  "blue-600": "text-blue-600",
  "purple-600": "text-purple-600",
  "orange-600": "text-orange-600",
  "teal-600": "text-teal-600",
  white: "text-white",
  muted: "text-gray-500",
} as const;

export type TextColor = keyof typeof TEXT_COLORS;
