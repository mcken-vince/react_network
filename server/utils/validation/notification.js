/**
 * Notification validation utilities
 */

const validateNotificationType = (type) => {
  const validTypes = [
    'connection_request',
    'connection_accepted',
    'connection_rejected',
    'new_message',
    'post_like',
    'post_comment',
    'post_share',
    'user_mention',
    'user_follow',
    'system_announcement',
    'account_update'
  ];
  
  if (!type || !validTypes.includes(type)) {
    return `Invalid notification type. Must be one of: ${validTypes.join(', ')}`;
  }
  return null;
};

const validateNotificationTitle = (title) => {
  if (!title || !title.trim()) {
    return 'Notification title is required';
  }
  if (title.length > 255) {
    return 'Notification title must be less than 255 characters';
  }
  return null;
};

const validateNotificationMessage = (message) => {
  if (!message || !message.trim()) {
    return 'Notification message is required';
  }
  if (message.length > 1000) {
    return 'Notification message must be less than 1000 characters';
  }
  return null;
};

const validateRelatedEntityType = (entityType) => {
  if (!entityType) return null; // Optional field
  
  const validTypes = ['connection', 'post', 'comment', 'like', 'user', 'conversation', 'message'];
  if (!validTypes.includes(entityType)) {
    return `Invalid related entity type. Must be one of: ${validTypes.join(', ')}`;
  }
  return null;
};

export const validateNotification = (data) => {
  const errors = {};
  
  if (!data.userId) {
    errors.userId = 'User ID is required';
  }
  
  const typeError = validateNotificationType(data.type);
  if (typeError) errors.type = typeError;
  
  const titleError = validateNotificationTitle(data.title);
  if (titleError) errors.title = titleError;
  
  const messageError = validateNotificationMessage(data.message);
  if (messageError) errors.message = messageError;
  
  if (data.relatedEntityType) {
    const entityTypeError = validateRelatedEntityType(data.relatedEntityType);
    if (entityTypeError) errors.relatedEntityType = entityTypeError;
  }
  
  // If relatedEntityType is provided, relatedEntityId should also be provided
  if (data.relatedEntityType && !data.relatedEntityId) {
    errors.relatedEntityId = 'Related entity ID is required when entity type is specified';
  }
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: 'Validation failed', errors }, data: null };
  }
  
  return { error: null, data };
};
