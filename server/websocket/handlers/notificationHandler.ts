import type { AppSocket } from "../io";
import { guard, requirePositiveInt } from "../guard";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationService";

export function registerNotificationHandlers(socket: AppSocket): void {
  const { userId } = socket.data;

  socket.on("notification:markRead", (notificationId) =>
    guard(socket, "mark notification as read", () =>
      markNotificationRead(
        requirePositiveInt(notificationId, "notificationId"),
        userId,
      ),
    ),
  );

  socket.on("notification:markAllRead", () =>
    guard(socket, "mark all notifications as read", () =>
      markAllNotificationsRead(userId),
    ),
  );
}
