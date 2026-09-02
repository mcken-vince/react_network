import type { AppSocket } from "../io";
import { rooms } from "../../types";
import { guard, requireIntArray, requireUuid } from "../guard";
import { validated } from "../../lib/http";
import { BadRequestError } from "../../lib/errors";
import { isUuid, validateGroupConversation } from "../../utils/validation";
import {
  assertParticipant,
  startDirectConversation,
  startGroupConversation,
} from "../../services/conversationService";

export function registerConversationHandlers(socket: AppSocket): void {
  const { userId } = socket.data;

  // Joining a room is what enables typing indicators for that conversation.
  socket.on("conversation:join", (conversationId) =>
    guard(socket, "join conversation", async () => {
      const id = requireUuid(conversationId, "conversationId");
      await assertParticipant(id, userId);
      const room = rooms.conversation(id);
      await socket.join(room);
      socket.data.rooms.add(room);
    }),
  );

  socket.on("conversation:leave", (conversationId) => {
    if (!isUuid(conversationId)) return;
    const room = rooms.conversation(conversationId);
    socket.leave(room);
    socket.data.rooms.delete(room);
  });

  // The service emits `conversation:created` to every participant.
  socket.on("conversation:create", (data) =>
    guard(socket, "create conversation", async () => {
      const userIds = requireIntArray(data.userIds, "userIds");

      if (data.type === "direct") {
        const [recipientId] = userIds;
        if (recipientId === undefined || userIds.length !== 1) {
          throw new BadRequestError(
            "A direct conversation needs exactly one other user",
          );
        }
        await startDirectConversation(userId, recipientId);
        return;
      }

      const { name, participantIds } = validated(
        validateGroupConversation({ name: data.name, participantIds: userIds }),
      );
      await startGroupConversation(userId, name, participantIds);
    }),
  );
}
