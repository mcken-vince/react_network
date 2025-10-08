/**
 * Messaging validation utilities
 */

const validateMessageContent = (content) => {
  if (!content || !content.trim()) {
    return 'Message content is required';
  }
  if (content.length > 5000) {
    return 'Message content must be less than 5000 characters';
  }
  return null;
};

const validateMessageType = (messageType) => {
  const validTypes = ['text', 'image', 'file', 'system'];
  if (messageType && !validTypes.includes(messageType)) {
    return 'Invalid message type. Must be one of: text, image, file, system';
  }
  return null;
};

const validateAttachmentUrl = (attachmentUrl) => {
  if (!attachmentUrl) return null; // Optional field
  
  try {
    new URL(attachmentUrl);
    if (attachmentUrl.length > 500) {
      return 'Attachment URL must be less than 500 characters';
    }
    return null;
  } catch (e) {
    return 'Attachment URL must be a valid URL';
  }
};

const validateConversationName = (name) => {
  if (!name || !name.trim()) {
    return 'Conversation name is required for group conversations';
  }
  if (name.length < 1 || name.length > 255) {
    return 'Conversation name must be between 1 and 255 characters';
  }
  return null;
};

const validateConversationType = (type) => {
  const validTypes = ['direct', 'group'];
  if (!type || !validTypes.includes(type)) {
    return 'Conversation type must be either direct or group';
  }
  return null;
};

const validateParticipantIds = (participantIds) => {
  if (!Array.isArray(participantIds)) {
    return 'Participant IDs must be an array';
  }
  if (participantIds.length < 2) {
    return 'At least 2 participants are required';
  }
  if (participantIds.length > 50) {
    return 'Maximum 50 participants allowed';
  }
  // Check for duplicates
  const uniqueIds = new Set(participantIds);
  if (uniqueIds.size !== participantIds.length) {
    return 'Duplicate participant IDs are not allowed';
  }
  return null;
};

export const validateMessage = (data) => {
  const errors = {};
  
  const contentError = validateMessageContent(data.content);
  if (contentError) errors.content = contentError;
  
  if (data.messageType) {
    const typeError = validateMessageType(data.messageType);
    if (typeError) errors.messageType = typeError;
  }
  
  if (data.attachmentUrl) {
    const attachmentError = validateAttachmentUrl(data.attachmentUrl);
    if (attachmentError) errors.attachmentUrl = attachmentError;
  }
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: 'Validation failed', errors }, data: null };
  }
  
  return { error: null, data };
};

export const validateGroupConversation = (data) => {
  const errors = {};
  
  const nameError = validateConversationName(data.name);
  if (nameError) errors.name = nameError;
  
  if (data.participantIds) {
    const participantError = validateParticipantIds(data.participantIds);
    if (participantError) errors.participantIds = participantError;
  } else {
    errors.participantIds = 'Participant IDs are required';
  }
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: 'Validation failed', errors }, data: null };
  }
  
  return { error: null, data };
};

export const validateDirectConversation = (data) => {
  const errors = {};
  
  if (!data.recipientId) {
    errors.recipientId = 'Recipient ID is required';
  }
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: 'Validation failed', errors }, data: null };
  }
  
  return { error: null, data };
};
