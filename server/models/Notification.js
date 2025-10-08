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

// Delete notifications by related entity (for cleanup)
export const deleteNotificationsByEntity = async (entityType, entityId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await SequelizeNotification.deleteByRelatedEntity(entityType, entityId, transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting notifications by entity:', error);
    throw error;
  }
};

// ============================================================================
// Helper functions to create specific notification types
// ============================================================================

/**
 * Helper function to create connection request notification
 */
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
    relatedEntityType: 'connection',
    relatedEntityId: connectionId,
    isRead: false,
    metadata: {
      actionable: true,
      category: 'connection'
    }
  });
};

/**
 * Helper function to create connection accepted notification
 */
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
    relatedEntityType: 'connection',
    relatedEntityId: connectionId,
    isRead: false,
    metadata: {
      actionable: false,
      category: 'connection'
    }
  });
};

/**
 * Helper function to create connection rejected notification
 */
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
    relatedEntityType: 'connection',
    relatedEntityId: connectionId,
    isRead: false,
    metadata: {
      actionable: false,
      category: 'connection'
    }
  });
};

// ============================================================================
// Future notification type helpers (ready for implementation)
// ============================================================================

/**
 * Helper function to create post like notification
 * @param {number} postOwnerId - ID of the user who owns the post
 * @param {number} likerId - ID of the user who liked the post
 * @param {number} postId - ID of the post that was liked
 * @param {number} [likeId] - Optional ID of the like entity
 */
export const createPostLikeNotification = async (postOwnerId, likerId, postId, likeId = null) => {
  const { User } = await import('./sequelize/index.js');
  const liker = await User.findByPk(likerId);
  
  if (!liker) {
    throw new Error('Liker not found');
  }

  return createNotification({
    userId: postOwnerId,
    type: 'post_like',
    title: 'New Like on Your Post',
    message: `${liker.firstName} ${liker.lastName} liked your post.`,
    relatedUserId: likerId,
    relatedEntityType: 'post',
    relatedEntityId: postId,
    isRead: false,
    metadata: {
      actionable: false,
      category: 'engagement',
      likeId: likeId
    }
  });
};

/**
 * Helper function to create post comment notification
 * @param {number} postOwnerId - ID of the user who owns the post
 * @param {number} commenterId - ID of the user who commented
 * @param {number} commentId - ID of the comment
 * @param {number} postId - ID of the post that was commented on
 */
export const createPostCommentNotification = async (postOwnerId, commenterId, commentId, postId) => {
  const { User } = await import('./sequelize/index.js');
  const commenter = await User.findByPk(commenterId);
  
  if (!commenter) {
    throw new Error('Commenter not found');
  }

  return createNotification({
    userId: postOwnerId,
    type: 'post_comment',
    title: 'New Comment on Your Post',
    message: `${commenter.firstName} ${commenter.lastName} commented on your post.`,
    relatedUserId: commenterId,
    relatedEntityType: 'comment',
    relatedEntityId: commentId,
    isRead: false,
    metadata: {
      actionable: true,
      category: 'engagement',
      postId: postId
    }
  });
};

/**
 * Helper function to create user mention notification
 * @param {number} mentionedUserId - ID of the user who was mentioned
 * @param {number} mentionerId - ID of the user who mentioned
 * @param {string} entityType - Type of entity where mention occurred ('post', 'comment', etc.)
 * @param {number} entityId - ID of the entity
 */
export const createUserMentionNotification = async (mentionedUserId, mentionerId, entityType, entityId) => {
  const { User } = await import('./sequelize/index.js');
  const mentioner = await User.findByPk(mentionerId);
  
  if (!mentioner) {
    throw new Error('Mentioner not found');
  }

  return createNotification({
    userId: mentionedUserId,
    type: 'user_mention',
    title: 'You Were Mentioned',
    message: `${mentioner.firstName} ${mentioner.lastName} mentioned you in a ${entityType}.`,
    relatedUserId: mentionerId,
    relatedEntityType: entityType,
    relatedEntityId: entityId,
    isRead: false,
    metadata: {
      actionable: true,
      category: 'user'
    }
  });
};

/**
 * Helper function to create system notification
 * @param {number} userId - ID of the user to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} [metadata] - Additional metadata
 */
export const createSystemNotification = async (userId, title, message, metadata = {}) => {
  return createNotification({
    userId: userId,
    type: 'system_announcement',
    title: title,
    message: message,
    relatedUserId: null,
    relatedEntityType: null,
    relatedEntityId: null,
    isRead: false,
    metadata: {
      actionable: false,
      category: 'system',
      ...metadata
    }
  });
};

/**
 * Helper function to create new message notification
 * @param {number} recipientId - ID of the user receiving the notification
 * @param {number} senderId - ID of the user who sent the message
 * @param {string} messageId - ID of the message
 * @param {string} conversationId - ID of the conversation
 * @param {string} [messagePreview] - Preview of the message content
 */
export const createNewMessageNotification = async (recipientId, senderId, messageId, conversationId, messagePreview = '') => {
  const { User } = await import('./sequelize/index.js');
  const sender = await User.findByPk(senderId);
  
  if (!sender) {
    throw new Error('Sender not found');
  }

  const preview = messagePreview.length > 50 
    ? messagePreview.substring(0, 50) + '...' 
    : messagePreview;

  return createNotification({
    userId: recipientId,
    type: 'new_message',
    title: 'New Message',
    message: `${sender.firstName} ${sender.lastName} sent you a message${preview ? `: "${preview}"` : '.'}`,
    relatedUserId: senderId,
    relatedEntityType: 'message',
    relatedEntityId: messageId,
    isRead: false,
    metadata: {
      actionable: true,
      category: 'messaging',
      conversationId: conversationId
    }
  });
};
