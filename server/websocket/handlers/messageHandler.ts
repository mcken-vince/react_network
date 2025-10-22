import type { Server, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../../types";
import {
  Message as MessageModel,
  Conversation as ConversationModel,
  ConversationParticipant as ConversationParticipantModel,
  User as UserModel,
} from "../../models";
import { v4 as uuidv4 } from "uuid";

export function handleMessageEvents(
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
  // Send a message
  socket.on("message:send", async (data) => {
    try {
      if (!socket.data.userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const { conversationId, content } = data;

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

      // Create message
      const message = await MessageModel.create({
        id: uuidv4(),
        conversationId,
        senderId: socket.data.userId,
        content,
        readBy: [socket.data.userId],
      });

      // Update conversation last message time
      await ConversationModel.update(
        { lastMessageAt: new Date() },
        { where: { id: conversationId } }
      );

      // Get message with sender info
      const fullMessage = await MessageModel.findByPk(message.id, {
        include: [
          {
            model: UserModel,
            as: "sender",
            attributes: [
              "id",
              "username",
              "firstName",
              "lastName",
              "profilePicture",
            ],
          },
        ],
      });

      // Emit to all participants in the conversation room
      io.to(`conversation:${conversationId}`).emit(
        "message:new",
        fullMessage?.toJSON() as any
      );
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Edit a message
  socket.on("message:edit", async (data) => {
    try {
      if (!socket.data.userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const { messageId, content } = data;

      // Find and verify ownership
      const message = await MessageModel.findOne({
        where: {
          id: messageId,
          senderId: socket.data.userId,
        },
      });

      if (!message) {
        socket.emit("error", { message: "Message not found or unauthorized" });
        return;
      }

      // Update message
      await message.update({
        content,
        editedAt: new Date(),
      });

      // Get updated message with sender info
      const fullMessage = await MessageModel.findByPk(message.id, {
        include: [
          {
            model: UserModel,
            as: "sender",
            attributes: [
              "id",
              "username",
              "firstName",
              "lastName",
              "profilePicture",
            ],
          },
        ],
      });

      // Emit to conversation room
      io.to(`conversation:${message.conversationId}`).emit(
        "message:updated",
        fullMessage?.toJSON() as any
      );
    } catch (error) {
      console.error("Error editing message:", error);
      socket.emit("error", { message: "Failed to edit message" });
    }
  });

  // Delete a message
  socket.on("message:delete", async (messageId) => {
    try {
      if (!socket.data.userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      // Find and verify ownership
      const message = await MessageModel.findOne({
        where: {
          id: messageId,
          senderId: socket.data.userId,
        },
      });

      if (!message) {
        socket.emit("error", { message: "Message not found or unauthorized" });
        return;
      }

      // Soft delete
      await message.update({ deletedAt: new Date() });

      // Emit to conversation room
      io.to(`conversation:${message.conversationId}`).emit(
        "message:deleted",
        messageId
      );
    } catch (error) {
      console.error("Error deleting message:", error);
      socket.emit("error", { message: "Failed to delete message" });
    }
  });

  // Mark messages as read
  socket.on("message:markRead", async (data) => {
    try {
      if (!socket.data.userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const { conversationId, messageIds } = data;

      // Update read status for messages
      for (const messageId of messageIds) {
        const message = await MessageModel.findByPk(messageId);
        if (message && !message.readBy?.includes(socket.data.userId)) {
          await message.update({
            readBy: [...(message.readBy || []), socket.data.userId],
          });
        }
      }

      // Update participant's last read time
      await ConversationParticipantModel.update(
        { lastReadAt: new Date() },
        {
          where: {
            conversationId,
            userId: socket.data.userId,
          },
        }
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
      socket.emit("error", { message: "Failed to mark messages as read" });
    }
  });

  // Handle typing indicators
  socket.on("message:typing", async (data) => {
    try {
      if (!socket.data.userId) return;

      const { conversationId, isTyping } = data;

      // Verify user is participant
      const participant = await ConversationParticipantModel.findOne({
        where: {
          conversationId,
          userId: socket.data.userId,
        },
      });

      if (!participant) return;

      // Broadcast to other participants
      socket.to(`conversation:${conversationId}`).emit("message:typing", {
        conversationId,
        userId: socket.data.userId,
        isTyping,
      });
    } catch (error) {
      console.error("Error handling typing indicator:", error);
    }
  });
}
