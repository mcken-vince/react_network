import {
  AlertTriangle,
  AtSign,
  Bell,
  Calendar,
  Check,
  CircleUser,
  Clock,
  FileText,
  Frown,
  Globe,
  Handshake,
  Heart,
  Image as ImageIcon,
  Inbox,
  Info,
  LayoutDashboard,
  Link2,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  MoreVertical,
  Newspaper,
  Pencil,
  RefreshCw,
  Reply,
  Search,
  Send,
  SendHorizontal,
  Settings,
  Share2,
  Smile,
  SmilePlus,
  ThumbsUp,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { TEXT_COLORS, type TextColor } from "./colors";

const ICONS = {
  // navigation
  dashboard: LayoutDashboard,
  feed: Newspaper,
  connections: Link2,
  handshake: Handshake,
  messages: MessageCircle,
  notifications: Bell,
  profile: CircleUser,
  search: Search,
  menu: Menu,
  logout: LogOut,
  // generic
  user: User,
  users: Users,
  location: MapPin,
  edit: Pencil,
  trash: Trash2,
  close: X,
  check: Check,
  warning: AlertTriangle,
  info: Info,
  bell: Bell,
  more: MoreHorizontal,
  moreVertical: MoreVertical,
  refresh: RefreshCw,
  clock: Clock,
  calendar: Calendar,
  settings: Settings,
  frown: Frown,
  fileText: FileText,
  // messaging
  send: SendHorizontal,
  reply: Reply,
  inbox: Inbox,
  sent: Send,
  // posts
  heart: Heart,
  comment: MessageSquare,
  image: ImageIcon,
  share: Share2,
  globe: Globe,
  lock: Lock,
  // reactions
  smile: Smile,
  smilePlus: SmilePlus,
  thumbsUp: ThumbsUp,
  // social
  userPlus: UserPlus,
  userCheck: UserCheck,
  userX: UserX,
  atSign: AtSign,
  megaphone: Megaphone,
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
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    />
  );
};

export default Icon;
