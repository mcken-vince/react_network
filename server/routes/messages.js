import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as ConversationModel from '../models/Conversation.js';
import * as MessageModel from '../models/Message.js';
import { ConversationParticipant } from '../models/sequelize/index.js';
import { 
  validateMessage, 
  validateGroupConversation, 
  validateDirectConversation 
} from '../utils/validation.js';
import { createNewMessageNotification } from '../models/Notification.js';

const router = express.Router();

// ============================================================================
// Conversation routes
// ============================================================================

/**
 * GET /api/conversations
 * Get user's conversations list
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const conversations = await ConversationModel.getUserConversations(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Enrich conversations with last message and unread count
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const conversationJSON = conversation.toJSON();
        const lastMessage = await conversation.getLastMessage();
        const unreadCount = await conversation.getUnreadCount(userId);

        return {
          ...conversationJSON,
          lastMessage: lastMessage ? lastMessage.toJSON() : null,
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      data: enrichedConversations,
      count: enrichedConversations.length
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch conversations' }
    });
  }
});

/**
 * POST /api/conversations
 * Start new direct conversation
 */
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId } = req.body;

    // Validate input
    const validation = validateDirectConversation({ recipientId });
    if (validation.error) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Check if user is trying to message themselves
    if (parseInt(recipientId) === userId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot create conversation with yourself' }
      });
    }

    // Find or create direct conversation
    const { conversation, created } = await ConversationModel.findOrCreateDirectConversation(
      userId,
      parseInt(recipientId)
    );

    // Get full conversation details
    const fullConversation = await ConversationModel.getConversationById(conversation.id, userId);

    res.status(created ? 201 : 200).json({
      success: true,
      data: fullConversation,
      created
    });
  } catch (error) {
    console.error('Error creating/finding conversation:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create conversation' }
    });
  }
});

/**
 * POST /api/conversations/group
 * Create group conversation
 */
router.post('/conversations/group', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, participantIds } = req.body;

    // Validate input
    const validation = validateGroupConversation({ name, participantIds });
    if (validation.error) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Ensure creator is in the participant list
    const allParticipants = [...new Set([userId, ...participantIds.map(id => parseInt(id))])];

    // Create group conversation
    const conversation = await ConversationModel.createGroupConversation(
      userId,
      name,
      allParticipants
    );

    // Get full conversation details
    const fullConversation = await ConversationModel.getConversationById(conversation.id, userId);

    res.status(201).json({
      success: true,
      data: fullConversation
    });
  } catch (error) {
    console.error('Error creating group conversation:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create group conversation' }
    });
  }
});

/**
 * GET /api/conversations/:id
 * Get conversation details
 */
router.get('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const conversation = await ConversationModel.getConversationById(id, userId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found or access denied' }
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch conversation' }
    });
  }
});

/**
 * GET /api/conversations/:id/messages
 * Get conversation messages (paginated)
 */
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { limit = 50, offset = 0, beforeMessageId } = req.query;

    // Verify user is participant
    const conversation = await ConversationModel.getConversationById(id, userId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found or access denied' }
      });
    }

    // Get messages
    const messages = await MessageModel.getConversationMessages(id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      beforeMessageId
    });

    res.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch messages' }
    });
  }
});

/**
 * POST /api/conversations/:id/messages
 * Send new message
 */
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: conversationId } = req.params;
    const { content, messageType = 'text', attachmentUrl, replyToId } = req.body;

    // Validate message
    const validation = validateMessage({ content, messageType, attachmentUrl });
    if (validation.error) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Verify user is participant
    const conversation = await ConversationModel.getConversationById(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found or access denied' }
      });
    }

    // Create message
    const messageData = {
      conversationId,
      senderId: userId,
      content,
      messageType,
      attachmentUrl: attachmentUrl || null,
      replyToId: replyToId || null
    };

    const message = await MessageModel.createMessage(messageData);

    // Get full message details
    const fullMessage = await MessageModel.getMessageById(message.id);

    // Send notifications to other participants (async, don't wait)
    const participants = await conversation.getActiveParticipants();
    participants.forEach(async (participant) => {
      if (participant.userId !== userId) {
        try {
          await createNewMessageNotification(
            participant.userId,
            userId,
            message.id,
            conversationId,
            content
          );
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
    });

    res.status(201).json({
      success: true,
      data: fullMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send message' }
    });
  }
});

/**
 * PUT /api/messages/:id
 * Edit message (only by sender)
 */
router.put('/messages/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { content } = req.body;

    // Validate content
    const validation = validateMessage({ content });
    if (validation.error) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Update message
    const message = await MessageModel.updateMessage(id, userId, content);

    // Get full message details
    const fullMessage = await MessageModel.getMessageById(message.id);

    res.json({
      success: true,
      data: fullMessage
    });
  } catch (error) {
    console.error('Error updating message:', error);
    if (error.message === 'Message not found') {
      return res.status(404).json({
        success: false,
        error: { message: 'Message not found' }
      });
    }
    if (error.message === 'Unauthorized to edit this message') {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only edit your own messages' }
      });
    }
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update message' }
    });
  }
});

/**
 * DELETE /api/messages/:id
 * Delete message (only by sender)
 */
router.delete('/messages/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await MessageModel.deleteMessage(id, userId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    if (error.message === 'Message not found') {
      return res.status(404).json({
        success: false,
        error: { message: 'Message not found' }
      });
    }
    if (error.message === 'Unauthorized to delete this message') {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only delete your own messages' }
      });
    }
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete message' }
    });
  }
});

/**
 * POST /api/conversations/:id/participants
 * Add user to group conversation
 */
router.post('/conversations/:id/participants', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: conversationId } = req.params;
    const { userId: newUserId } = req.body;

    if (!newUserId) {
      return res.status(400).json({
        success: false,
        error: { message: 'User ID is required' }
      });
    }

    // Get conversation and verify it's a group
    const conversation = await ConversationModel.getConversationById(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found or access denied' }
      });
    }

    if (conversation.type !== 'group') {
      return res.status(400).json({
        success: false,
        error: { message: 'Can only add participants to group conversations' }
      });
    }

    // Check if requester is an admin
    const requesterParticipant = await ConversationParticipant.getParticipant(conversationId, userId);
    if (!requesterParticipant || !requesterParticipant.isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can add participants' }
      });
    }

    // Add participant
    await ConversationParticipant.addParticipant(conversationId, parseInt(newUserId), false);

    res.status(201).json({
      success: true,
      message: 'Participant added successfully'
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add participant' }
    });
  }
});

/**
 * DELETE /api/conversations/:id/participants/:userId
 * Remove user from conversation
 */
router.delete('/conversations/:id/participants/:userId', authenticateToken, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { id: conversationId, userId: targetUserId } = req.params;

    // Get conversation
    const conversation = await ConversationModel.getConversationById(conversationId, requesterId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found or access denied' }
      });
    }

    if (conversation.type !== 'group') {
      return res.status(400).json({
        success: false,
        error: { message: 'Can only remove participants from group conversations' }
      });
    }

    const targetUserIdInt = parseInt(targetUserId);

    // Check if user is removing themselves or if they're an admin
    if (requesterId !== targetUserIdInt) {
      const requesterParticipant = await ConversationParticipant.getParticipant(conversationId, requesterId);
      if (!requesterParticipant || !requesterParticipant.isAdmin) {
        return res.status(403).json({
          success: false,
          error: { message: 'Only admins can remove other participants' }
        });
      }
    }

    // Remove participant
    await ConversationParticipant.removeParticipant(conversationId, targetUserIdInt);

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to remove participant' }
    });
  }
});

/**
 * PUT /api/conversations/:id/read
 * Mark conversation as read
 */
router.put('/conversations/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: conversationId } = req.params;

    // Verify user is participant
    const conversation = await ConversationModel.getConversationById(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found or access denied' }
      });
    }

    // Mark as read
    await ConversationParticipant.markConversationAsRead(conversationId, userId);

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark conversation as read' }
    });
  }
});

export default router;
