import {
  Bell,
  Check,
  CircleUser,
  Handshake,
  Info,
  LayoutDashboard,
  Link2,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Newspaper,
  Pencil,
  Search,
  TriangleAlert,
  User,
  X,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { TEXT_COLORS, type TextColor } from "./colors";

const ICONS = {
  location: MapPin,
  user: User,
  edit: Pencil,
  close: X,
  check: Check,
  warning: TriangleAlert,
  info: Info,
  menu: Menu,
  bell: Bell,
  logout: LogOut,
  dashboard: LayoutDashboard,
  feed: Newspaper,
  connections: Link2,
  handshake: Handshake,
  messages: MessageCircle,
  notifications: Bell,
  profile: CircleUser,
  search: Search,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
export type IconSize = "small" | "medium" | "large";

const SIZE_PX: Record<IconSize, number> = { small: 16, medium: 20, large: 24 };

interface IconProps extends Omit<LucideProps, "size" | "color"> {
  name: IconName;
  size?: IconSize;
  /** "current" inherits the surrounding text colour. */
  color?: TextColor | "current";
}

const Icon = ({
  name,
  size = "medium",
  color = "current",
  className,
  ...props
}: IconProps) => {
  const Component = ICONS[name];
  return (
    <Component
      size={SIZE_PX[size]}
      className={cn(
        "inline-block flex-shrink-0",
        color !== "current" && TEXT_COLORS[color],
        className,
      )}
      aria-label={name}
      {...props}
    />
  );
};

export default Icon;
