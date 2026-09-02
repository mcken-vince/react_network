import type { AppSocket } from "./io";
import { rooms } from "../types";
import { registerNotificationHandlers } from "./handlers/notificationHandler";
import { registerMessageHandlers } from "./handlers/messageHandler";
import { registerConversationHandlers } from "./handlers/conversationHandler";
import { registerPresenceHandlers } from "./handlers/presenceHandler";

/** Wire up a freshly authenticated socket. */
export function setupWebSocketHandlers(socket: AppSocket): void {
  // Personal room: the target for notifications, messages, and conversation events.
  socket.join(rooms.user(socket.data.userId));

  registerNotificationHandlers(socket);
  registerMessageHandlers(socket);
  registerConversationHandlers(socket);
  registerPresenceHandlers(socket);
}
