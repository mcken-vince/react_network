import { Conversation as SequelizeConversation } from './sequelize/index.js';
import sequelize from '../config/sequelize.js';

// Re-export the Sequelize Conversation model as default
export default SequelizeConversation;

// Create conversation with transaction
export const createConversation = async (conversationData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const conversation = await SequelizeConversation.createConversation(conversationData, transaction);
    await transaction.commit();
    return conversation;
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Get conversation by ID with user permission check
export const getConversationById = async (conversationId, userId) => {
  try {
    return await SequelizeConversation.getConversationById(conversationId, userId);
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
};

// Get user's conversations
export const getUserConversations = async (userId, options = {}) => {
  try {
    return await SequelizeConversation.getUserConversations(userId, options);
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
};

// Find or create direct conversation between two users
export const findOrCreateDirectConversation = async (userId1, userId2) => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await SequelizeConversation.findOrCreateDirectConversation(userId1, userId2, transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error('Error finding/creating direct conversation:', error);
    throw error;
  }
};

// Create group conversation with participants
export const createGroupConversation = async (creatorId, name, participantIds) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { ConversationParticipant } = await import('./sequelize/index.js');
    
    // Create conversation
    const conversation = await SequelizeConversation.create({
      type: 'group',
      name,
      createdBy: creatorId
    }, { transaction });

    // Add creator as admin participant
    const participants = [
      {
        conversationId: conversation.id,
        userId: creatorId,
        isAdmin: true,
        isActive: true
      }
    ];

    // Add other participants
    participantIds.forEach(userId => {
      if (userId !== creatorId) {
        participants.push({
          conversationId: conversation.id,
          userId: userId,
          isAdmin: false,
          isActive: true
        });
      }
    });

    await ConversationParticipant.bulkCreate(participants, { transaction });
    await transaction.commit();

    return conversation;
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating group conversation:', error);
    throw error;
  }
};
