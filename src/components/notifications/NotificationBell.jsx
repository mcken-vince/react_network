import { useState, useRef, useEffect } from "react";
import { Button, Text, Stack } from "../atoms";
import { useNotifications } from "../../hooks/useNotificationsContext";
import NotificationsList from "./NotificationsList";

const NotificationBell = () => {
  const { unreadCount, refreshNotifications } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleToggleDropdown = () => {
    setShowDropdown((prev) => {
      if (!prev) {
        // Refresh notifications when opening dropdown
        refreshNotifications();
      }
      return !prev;
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleDropdown}
        className="relative"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <Text weight="semibold">Notifications</Text>
          </div>

          <div className="max-h-80 overflow-y-auto p-3">
            <NotificationsList />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
