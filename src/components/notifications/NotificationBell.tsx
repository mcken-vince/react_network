import { useEffect, useRef, useState } from "react";
import { Button, Icon, Text } from "../atoms";
import {
  useRefreshNotifications,
  useUnreadNotificationCount,
} from "../../hooks/useNotifications";
import NotificationsList from "./NotificationsList";

const NotificationBell = () => {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const refresh = useRefreshNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        aria-label={`Notifications${
          unreadCount > 0 ? ` (${unreadCount} unread)` : ""
        }`}
        onClick={() =>
          setOpen((prev) => {
            if (!prev) refresh();
            return !prev;
          })
        }
      >
        <Icon name="bell" size="medium" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[28rem] overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <Text weight="semibold">Notifications</Text>
          </div>
          <div className="max-h-96 overflow-y-auto p-3">
            <NotificationsList onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
