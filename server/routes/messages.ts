import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Conversation, Message } from "../models";
import {
  validateMessage,
  validateDirectConversation,
} from "../utils/validation.js";
import type { Response } from "express";
import type { AuthRequest } from "../types";

const router = express.Router();

// ============================================================================
// Conversation routes
// ============================================================================

/**
 * GET /api/conversations
 * Get user's conversations list
 */
router.get(
  "/conversations",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { limit = 50, offset = 0 } = req.query;

      const conversations = await Conversation.getUserConversations(userId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      // Enrich conversations with last message and unread count
      const enrichedConversations = await Promise.all(
        conversations.map(async (conversation: any) => {
          const conversationJSON = conversation.toJSON();
          const lastMessage = await conversation.getLastMessage();
          const unreadCount = await conversation.getUnreadCount(userId);

          return {
            ...conversationJSON,
            lastMessage: lastMessage ? lastMessage.toJSON() : null,
            unreadCount,
          };
        })
      );

      res.json({
        success: true,
        data: enrichedConversations,
        count: enrichedConversations.length,
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch conversations" },
      });
    }
  }
);

/**
 * POST /api/conversations
 * Start new direct conversation
 */
router.post(
  "/conversations",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { recipientId } = req.body;

      // Validate input
      const validation = validateDirectConversation({ recipientId });
      if (validation.error) {
        res.status(400).json({
          success: false,
          error: validation.error,
        });
        return;
      }

      // Check if user is trying to message themselves
      if (parseInt(recipientId) === userId) {
        res.status(400).json({
          success: false,
          error: { message: "Cannot create conversation with yourself" },
        });
        return;
      }

      // Find or create direct conversation
      const { conversation, created } =
        await Conversation.findOrCreateDirectConversation(
          userId,
          parseInt(recipientId)
        );

      // Get full conversation details
      const fullConversation = await Conversation.getConversationById(
        conversation.id,
        userId
      );

      res.status(created ? 201 : 200).json({
        success: true,
        data: fullConversation,
        created,
      });
    } catch (error) {
      console.error("Error creating/finding conversation:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to create/find conversation" },
      });
    }
  }
);

/**
 * GET /api/conversations/:conversationId
 * Get conversation details
 */
router.get(
  "/conversations/:conversationId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: { message: "Conversation ID is required" },
        });
        return;
      }

      const conversation = await Conversation.getConversationById(
        conversationId,
        userId
      );

      if (!conversation) {
        res.status(404).json({
          success: false,
          error: { message: "Conversation not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch conversation" },
      });
    }
  }
);

// ============================================================================
// Message routes
// ============================================================================

/**
 * GET /api/conversations/:conversationId/messages
 * Get messages for a conversation
 */
router.get(
  "/conversations/:conversationId/messages",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { conversationId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: { message: "Conversation ID is required" },
        });
        return;
      }

      // Check if user has access to this conversation
      const conversation = await Conversation.getConversationById(
        conversationId,
        userId
      );
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: { message: "Conversation not found" },
        });
        return;
      }

      const messages = await Message.getConversationMessages(conversationId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({
        success: true,
        data: messages.map((message: any) => message.toJSON()),
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: messages.length,
        },
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch messages" },
      });
    }
  }
);

/**
 * POST /api/conversations/:conversationId/messages
 * Send a message to a conversation
 */
router.post(
  "/conversations/:conversationId/messages",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { conversationId } = req.params;
      const { content } = req.body;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: { message: "Conversation ID is required" },
        });
        return;
      }

      // Validate message content
      const validation = validateMessage({ content });
      if (validation.error) {
        res.status(400).json({
          success: false,
          error: validation.error,
        });
        return;
      }

      // Check if user has access to this conversation
      const conversation = await Conversation.getConversationById(
        conversationId,
        userId
      );
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: { message: "Conversation not found" },
        });
        return;
      }

      // Create message
      const messageData = {
        conversationId,
        senderId: userId,
        content,
        readBy: [userId], // Mark as read by sender
      };

      const message = await Message.createMessage(messageData);

      // Update conversation's lastMessageAt
      await conversation.update({ lastMessageAt: new Date() });

      res.status(201).json({
        success: true,
        data: message.toJSON(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to send message" },
      });
    }
  }
);

/**
 * PUT /api/messages/:messageId/read
 * Mark a message as read
 */
router.put(
  "/messages/:messageId/read",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { messageId } = req.params;

      if (!messageId) {
        res.status(400).json({
          success: false,
          error: { message: "Message ID is required" },
        });
        return;
      }

      const message = await Message.getMessageById(messageId);

      if (!message) {
        res.status(404).json({
          success: false,
          error: { message: "Message not found" },
        });
        return;
      }

      // Add userId to readBy array if not already present
      const readBy = message.readBy || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        await message.update({ readBy });
      }

      res.json({
        success: true,
        data: message.toJSON(),
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to mark message as read" },
      });
    }
  }
);

export default router;
