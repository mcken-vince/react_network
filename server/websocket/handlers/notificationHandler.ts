import type { Server, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  Notification as NotificationType,
} from "../../types";
import { Notification as NotificationModel } from "../../models";

export function handleNotificationEvents(
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
) {
  // Subscribe to notifications
  socket.on("subscribe:notifications", async () => {
    if (!socket.data.userId) return;

    const room = `notifications:${socket.data.userId}`;
    socket.join(room);
    socket.data.rooms.add(room);

    console.log(`User ${socket.data.userId} subscribed to notifications`);
  });

  // Unsubscribe from notifications
  socket.on("unsubscribe:notifications", () => {
    if (!socket.data.userId) return;

    const room = `notifications:${socket.data.userId}`;
    socket.leave(room);
    socket.data.rooms.delete(room);

    console.log(`User ${socket.data.userId} unsubscribed from notifications`);
  });

  // Mark notification as read
  socket.on("notification:markRead", async (notificationId: string) => {
    try {
      if (!socket.data.userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const notification = await NotificationModel.findOne({
        where: {
          id: notificationId,
          userId: socket.data.userId,
        },
      });

      if (!notification) {
        socket.emit("error", { message: "Notification not found" });
        return;
      }

      await notification.update({ isRead: true });

      // Emit updated notification to the user
      const room = `notifications:${socket.data.userId}`;
      io.to(room).emit("notification:updated", notification.toJSON() as any);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      socket.emit("error", { message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  socket.on("notification:markAllRead", async () => {
    try {
      if (!socket.data.userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      await NotificationModel.update(
        { isRead: true },
        {
          where: {
            userId: socket.data.userId,
            isRead: false,
          },
        }
      );

      // Fetch updated notifications
      const notifications = await NotificationModel.findAll({
        where: { userId: socket.data.userId },
        order: [["createdAt", "DESC"]],
        limit: 20,
      });

      // Emit updated notifications to the user
      const room = `notifications:${socket.data.userId}`;
      notifications.forEach((notification) => {
        io.to(room).emit("notification:updated", notification.toJSON() as any);
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      socket.emit("error", {
        message: "Failed to mark all notifications as read",
      });
    }
  });
}

// Helper function to emit notification to a user (called from routes)
export function emitNotificationToUser(
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  userId: string,
  notification: NotificationType
) {
  const room = `notifications:${userId}`;
  io.to(room).emit("notification:new", notification as any);
}
