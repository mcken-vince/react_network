import type { Server, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../../types";

// Store user presence status
const userPresence = new Map<
  number,
  {
    status: "online" | "away" | "offline";
    lastSeen: Date;
    socketIds: Set<string>;
  }
>();

export function handlePresenceEvents(
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
  // Initialize user presence on connection
  if (socket.data.userId) {
    const presence = userPresence.get(socket.data.userId) || {
      status: "online" as const,
      lastSeen: new Date(),
      socketIds: new Set<string>(),
    };

    presence.socketIds.add(socket.id);
    presence.status = "online";
    presence.lastSeen = new Date();

    userPresence.set(socket.data.userId, presence);
  }

  // Update presence status
  socket.on("presence:update", (status) => {
    if (!socket.data.userId) return;

    const presence = userPresence.get(socket.data.userId);
    if (presence) {
      presence.status = status;
      presence.lastSeen = new Date();

      // Broadcast status update to all users
      socket.broadcast.emit("user:status", {
        userId: socket.data.userId,
        status,
      });
    }
  });

  // Handle disconnect for presence
  socket.on("disconnect", () => {
    if (!socket.data.userId) return;

    const presence = userPresence.get(socket.data.userId);
    if (presence) {
      presence.socketIds.delete(socket.id);

      // If user has no more active sockets, mark as offline
      if (presence.socketIds.size === 0) {
        presence.status = "offline";
        presence.lastSeen = new Date();

        // Broadcast offline status
        socket.broadcast.emit("user:status", {
          userId: socket.data.userId,
          status: "offline",
        });

        // Clean up after a delay (optional)
        setTimeout(
          () => {
            const currentPresence = userPresence.get(socket.data.userId);
            if (currentPresence && currentPresence.socketIds.size === 0) {
              userPresence.delete(socket.data.userId);
            }
          },
          5 * 60 * 1000
        ); // 5 minutes
      }
    }
  });
}

// Utility function to get online users
export function getOnlineUsers(): number[] {
  return Array.from(userPresence.entries())
    .filter(([_, presence]) => presence.status === "online")
    .map(([userId]) => userId);
}

// Utility function to get user status
export function getUserStatus(userId: number): "online" | "away" | "offline" {
  const presence = userPresence.get(userId);
  return presence?.status || "offline";
}

// Utility function to check if user is online
export function isUserOnline(userId: number): boolean {
  const presence = userPresence.get(userId);
  return presence?.status === "online" || false;
}
