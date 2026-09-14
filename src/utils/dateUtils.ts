const plural = (n: number, unit: string): string =>
  `${n} ${unit}${n !== 1 ? "s" : ""} ago`;

const formatRelativeTime = (dateString: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(minutes, "minute");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hour");

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return plural(weeks, "week");

  const months = Math.floor(days / 30);
  if (months < 12) return plural(months, "month");

  return plural(Math.floor(days / 365), "year");
};

/** Relative within a week, then "Mon D", then "Mon D, YYYY". */
export const formatPostDate = (dateString: string): string => {
  const date = new Date(dateString);
  const diffInDays = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays < 7) return formatRelativeTime(dateString);

  if (diffInDays < 365) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};