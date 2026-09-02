import type { AppSocket } from "./io";
import { broadcast, emitToUsers } from "./io";
import { rooms } from "../types";
import { isUuid } from "../utils/validation";
import {
  activeParticipantIds,
  assertParticipant,
} from "../services/conversationService";

/** Open socket ids per user. Presence is derived from this and nothing else. */
const socketsByUser = new Map<number, Set<string>>();

/** Wire up a freshly authenticated socket. */
export function setupWebSocketHandlers(socket: AppSocket): void {
  const { userId } = socket.data;

  // Personal room: the target for notifications, messages, conversation events.
  socket.join(rooms.user(userId));

  // --- Presence ------------------------------------------------------------

  // Tell the newcomer who is online *before* announcing them, so they don't
  // have to special-case their own status event.
  socket.emit("presence:snapshot", [...socketsByUser.keys()]);

  const sockets = socketsByUser.get(userId) ?? new Set<string>();
  if (sockets.size === 0) {
    broadcast("user:status", { userId, status: "online" });
  }
  sockets.add(socket.id);
  socketsByUser.set(userId, sockets);

  socket.on("disconnect", () => {
    sockets.delete(socket.id);
    if (sockets.size === 0) {
      socketsByUser.delete(userId);
      broadcast("user:status", { userId, status: "offline" });
    }
  });

  // --- Typing (the only client → server event) -----------------------------

  socket.on("message:typing", async (data) => {
    const { conversationId } = data;
    if (!isUuid(conversationId)) return;

    try {
      await assertParticipant(conversationId, userId);
      const recipients = (await activeParticipantIds(conversationId)).filter(
        (id) => id !== userId,
      );
      emitToUsers(recipients, "message:typing", {
        conversationId,
        userId,
        isTyping: Boolean(data.isTyping),
      });
    } catch (error) {
      // Non-participant or transient DB error: a typing indicator isn't worth surfacing.
      console.warn(
        `[socket] typing indicator dropped for user ${userId}:`,
        error,
      );
    }
  });
}
