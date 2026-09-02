import type { AppSocket } from "../io";
import type { PresenceStatus } from "../../types";

interface Presence {
  status: PresenceStatus;
  lastSeen: Date;
  socketIds: Set<string>;
}

const STATUSES: readonly PresenceStatus[] = ["online", "away", "offline"];
const isPresenceStatus = (value: unknown): value is PresenceStatus =>
  typeof value === "string" && (STATUSES as readonly string[]).includes(value);

/** Forget a user's presence this long after their last socket disconnects. */
const OFFLINE_CLEANUP_MS = 5 * 60 * 1000;

const presenceByUser = new Map<number, Presence>();

export function registerPresenceHandlers(socket: AppSocket): void {
  const { userId } = socket.data;

  const presence = presenceByUser.get(userId) ?? {
    status: "online",
    lastSeen: new Date(),
    socketIds: new Set<string>(),
  };
  const firstSocket = presence.socketIds.size === 0;

  presence.socketIds.add(socket.id);
  presence.status = "online";
  presence.lastSeen = new Date();
  presenceByUser.set(userId, presence);

  // Only announce when the *user* comes online, not every additional tab.
  if (firstSocket) {
    socket.broadcast.emit("user:status", { userId, status: "online" });
  }

  socket.on("presence:update", (status) => {
    if (!isPresenceStatus(status)) return;
    presence.status = status;
    presence.lastSeen = new Date();
    socket.broadcast.emit("user:status", { userId, status });
  });

  socket.on("disconnect", () => {
    presence.socketIds.delete(socket.id);
    if (presence.socketIds.size > 0) return;

    presence.status = "offline";
    presence.lastSeen = new Date();
    socket.broadcast.emit("user:status", { userId, status: "offline" });

    setTimeout(() => {
      const current = presenceByUser.get(userId);
      if (current && current.socketIds.size === 0) {
        presenceByUser.delete(userId);
      }
    }, OFFLINE_CLEANUP_MS);
  });
}
