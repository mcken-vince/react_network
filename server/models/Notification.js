import { Notification as SequelizeNotification } from './sequelize/index.js';
import sequelize from '../config/sequelize.js';

// Re-export the Sequelize Notification model as default
export default SequelizeNotification;

// Create notification with transaction
export const createNotification = async (notificationData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const notification = await SequelizeNotification.createNotification(notificationData, transaction);
    await transaction.commit();
    return notification;
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get user notifications
export const getUserNotifications = async (userId, options = {}) => {
  try {
    return await SequelizeNotification.getUserNotifications(userId, options);
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const notification = await SequelizeNotification.markAsRead(notificationId, userId, transaction);
    await transaction.commit();
    return notification;
  } catch (error) {
    await transaction.rollback();
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await SequelizeNotification.markAllAsRead(userId, transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Get unread count
export const getUnreadNotificationCount = async (userId) => {
  try {
    return await SequelizeNotification.getUnreadCount(userId);
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await SequelizeNotification.deleteNotification(notificationId, userId, transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Helper function to create connection request notification
export const createConnectionRequestNotification = async (recipientId, requesterId, connectionId) => {
  // Get requester info to create meaningful notification
  const { User } = await import('./sequelize/index.js');
  const requester = await User.findByPk(requesterId);
  
  if (!requester) {
    throw new Error('Requester not found');
  }

  return createNotification({
    userId: recipientId,
    type: 'connection_request',
    title: 'New Connection Request',
    message: `${requester.firstName} ${requester.lastName} wants to connect with you.`,
    relatedUserId: requesterId,
    connectionId: connectionId,
    isRead: false
  });
};

// Helper function to create connection accepted notification
export const createConnectionAcceptedNotification = async (requesterId, accepterId, connectionId) => {
  const { User } = await import('./sequelize/index.js');
  const accepter = await User.findByPk(accepterId);
  
  if (!accepter) {
    throw new Error('Accepter not found');
  }

  return createNotification({
    userId: requesterId,
    type: 'connection_accepted',
    title: 'Connection Request Accepted',
    message: `${accepter.firstName} ${accepter.lastName} accepted your connection request.`,
    relatedUserId: accepterId,
    connectionId: connectionId,
    isRead: false
  });
};

// Helper function to create connection rejected notification
export const createConnectionRejectedNotification = async (requesterId, rejecterId, connectionId) => {
  const { User } = await import('./sequelize/index.js');
  const rejecter = await User.findByPk(rejecterId);
  
  if (!rejecter) {
    throw new Error('Rejecter not found');
  }

  return createNotification({
    userId: requesterId,
    type: 'connection_rejected',
    title: 'Connection Request Declined',
    message: `${rejecter.firstName} ${rejecter.lastName} declined your connection request.`,
    relatedUserId: rejecterId,
    connectionId: connectionId,
    isRead: false
  });
};
