import { Message as SequelizeMessage } from './sequelize/index.js';
import sequelize from '../config/sequelize.js';

// Re-export the Sequelize Message model as default
export default SequelizeMessage;

// Create message with transaction
export const createMessage = async (messageData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const message = await SequelizeMessage.createMessage(messageData, transaction);
    await transaction.commit();
    return message;
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating message:', error);
    throw error;
  }
};

// Get conversation messages with pagination
export const getConversationMessages = async (conversationId, options = {}) => {
  try {
    return await SequelizeMessage.getConversationMessages(conversationId, options);
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    throw error;
  }
};

// Get message by ID
export const getMessageById = async (messageId) => {
  try {
    return await SequelizeMessage.getMessageById(messageId);
  } catch (error) {
    console.error('Error getting message:', error);
    throw error;
  }
};

// Update message
export const updateMessage = async (messageId, userId, newContent) => {
  const transaction = await sequelize.transaction();
  
  try {
    const message = await SequelizeMessage.updateMessage(messageId, userId, newContent, transaction);
    await transaction.commit();
    return message;
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating message:', error);
    throw error;
  }
};

// Delete message
export const deleteMessage = async (messageId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await SequelizeMessage.deleteMessage(messageId, userId, transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting message:', error);
    throw error;
  }
};
