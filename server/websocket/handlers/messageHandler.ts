import type { AppSocket } from "../io";
import { rooms } from "../../types";
import { guard, requireStringArray, requireUuid } from "../guard";
import { validated } from "../../lib/http";
import { ForbiddenError } from "../../lib/errors";
import { validateMessage } from "../../utils/validation";
import {
  deleteMessage,
  editMessage,
  markConversationRead,
  sendMessage,
} from "../../services/messageService";

export function registerMessageHandlers(socket: AppSocket): void {
  const { userId } = socket.data;

  socket.on("message:send", (data) =>
    guard(socket, "send message", async () => {
      const conversationId = requireUuid(data.conversationId, "conversationId");
      const payload = validated(validateMessage(data));
      await sendMessage(conversationId, userId, payload);
    }),
  );

  socket.on("message:edit", (data) =>
    guard(socket, "edit message", async () => {
      const messageId = requireUuid(data.messageId, "messageId");
      const { content } = validated(validateMessage(data));
      await editMessage(messageId, userId, content);
    }),
  );

  socket.on("message:delete", (messageId) =>
    guard(socket, "delete message", () =>
      deleteMessage(requireUuid(messageId, "messageId"), userId),
    ),
  );

  socket.on("message:markRead", (data) =>
    guard(socket, "mark messages as read", () =>
      markConversationRead(
        requireUuid(data.conversationId, "conversationId"),
        userId,
        requireStringArray(data.messageIds, "messageIds"),
      ),
    ),
  );

  // Typing indicators only go to sockets currently in the conversation room.
  socket.on("message:typing", (data) =>
    guard(socket, "send typing indicator", async () => {
      const conversationId = requireUuid(data.conversationId, "conversationId");
      const room = rooms.conversation(conversationId);
      if (!socket.data.rooms.has(room)) {
        throw new ForbiddenError(
          "Join the conversation before sending typing indicators",
        );
      }
      socket.to(room).emit("message:typing", {
        conversationId,
        userId,
        isTyping: Boolean(data.isTyping),
      });
    }),
  );
}
