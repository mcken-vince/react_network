import { Icon } from "../atoms";
import type { IconName } from "../atoms/Icon";
import type { PostVisibility } from "../../types";

interface BadgeConfig {
  icon: IconName;
  label: string;
  className: string;
  title: string;
}

const CONFIG: Record<PostVisibility, BadgeConfig> = {
  public: {
    icon: "globe",
    label: "Public",
    className: "bg-green-100 text-green-700",
    title: "Visible to everyone",
  },
  friends: {
    icon: "users",
    label: "Friends",
    className: "bg-blue-100 text-blue-700",
    title: "Visible to friends only",
  },
  private: {
    icon: "lock",
    label: "Private",
    className: "bg-gray-100 text-gray-700",
    title: "Only visible to you",
  },
};

interface PostVisibilityBadgeProps {
  visibility: PostVisibility;
}

export default function PostVisibilityBadge({
  visibility,
}: PostVisibilityBadgeProps) {
  const config = CONFIG[visibility];
  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
      title={config.title}
    >
      <Icon name={config.icon} size="small" className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </div>
  );
}
