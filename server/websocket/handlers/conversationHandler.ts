import type { Server, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../../types";
import { Conversation as ConversationModel, ConversationParticipant as ConversationParticipantModel } from "../../models";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

export function handleConversationEvents(
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
  // Join a conversation room
  socket.on("conversation:join", async (conversationId) => {
    try {
      if (!socket.data.userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      // Verify user is participant
      const participant = await ConversationParticipantModel.findOne({
        where: {
          conversationId,
          userId: socket.data.userId,
        },
      });

      if (!participant) {
        socket.emit("error", {
          message: "Not a participant in this conversation",
        });
        return;
      }

      const room = `conversation:${conversationId}`;
      socket.join(room);
      socket.data.rooms.add(room);

      console.log(
        `User ${socket.data.userId} joined conversation ${conversationId}`
      );
    } catch (error) {
      console.error("Error joining conversation:", error);
      socket.emit("error", { message: "Failed to join conversation" });
    }
  });

  // Leave a conversation room
  socket.on("conversation:leave", (conversationId) => {
    if (!socket.data.userId) return;

    const room = `conversation:${conversationId}`;
    socket.leave(room);
    socket.data.rooms.delete(room);

    console.log(
      `User ${socket.data.userId} left conversation ${conversationId}`
    );
  });

  // Create a new conversation
  socket.on("conversation:create", async (data) => {
    try {
      if (!socket.data.userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const { userIds, type, name } = data;

      // Include creator in participants
      const allUserIds = [...new Set([socket.data.userId, ...userIds])];

      // For direct messages, check if conversation already exists
      if (type === "direct" && allUserIds.length === 2) {
        const existingConversation = await ConversationModel.findOne({
          where: { type: "direct" },
          include: [
            {
              model: ConversationParticipantModel,
              as: "participants",
              where: { userId: { [Op.in]: allUserIds } },
              required: true,
            },
          ],
          group: ["Conversation.id"],
          having: ConversationModel.sequelize?.literal(
            'COUNT(DISTINCT "participants"."userId") = 2'
          ),
        });

        if (existingConversation) {
          // Join existing conversation
          const room = `conversation:${existingConversation.id}`;
          socket.join(room);
          socket.data.rooms.add(room);
          return;
        }
      }

      // Create new conversation
      const conversation = await ConversationModel.create({
        id: uuidv4(),
        type,
        name,
        createdBy: socket.data.userId,
      });

      // Add participants
      const participantPromises = allUserIds.map((userId) =>
        ConversationParticipantModel.create({
          id: uuidv4(),
          conversationId: conversation.id,
          userId,
          role: userId === socket.data.userId ? "admin" : "member",
          joinedAt: new Date(),
        })
      );

      await Promise.all(participantPromises);

      // Join creator to the conversation room
      const room = `conversation:${conversation.id}`;
      socket.join(room);
      socket.data.rooms.add(room);

      // Notify all participants about the new conversation
      for (const userId of allUserIds) {
        io.to(`user:${userId}`).emit(
          "conversation:created",
          conversation.toJSON() as any
        );
      }

      console.log(
        `Conversation ${conversation.id} created by ${socket.data.userId}`
      );
    } catch (error) {
      console.error("Error creating conversation:", error);
      socket.emit("error", { message: "Failed to create conversation" });
    }
  });
}
