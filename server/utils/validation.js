/**
 * Authentication validation utilities
 */

export const validateUsername = (username) => {
  if (!username || !username.trim()) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
};

export const validatePassword = (password, isRequired = true) => {
  if (!password && isRequired) {
    return 'Password is required';
  }
  if (password && password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validateLogin = (data) => {
  const errors = {};
  
  const usernameError = validateUsername(data.username);
  if (usernameError) errors.username = usernameError;
  
  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: 'Validation failed', errors }, data: null };
  }
  
  return { error: null, data };
};


/**
 * Messaging validation utilities
 */

export const validateMessageContent = (content) => {
  if (!content || !content.trim()) {
    return 'Message content is required';
  }
  if (content.length > 5000) {
    return 'Message content must be less than 5000 characters';
  }
  return null;
};

export const validateMessageType = (messageType) => {
  const validTypes = ['text', 'image', 'file', 'system'];
  if (messageType && !validTypes.includes(messageType)) {
    return 'Invalid message type. Must be one of: text, image, file, system';
  }
  return null;
};

export const validateAttachmentUrl = (attachmentUrl) => {
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

export const validateConversationName = (name) => {
  if (!name || !name.trim()) {
    return 'Conversation name is required for group conversations';
  }
  if (name.length < 1 || name.length > 255) {
    return 'Conversation name must be between 1 and 255 characters';
  }
  return null;
};

export const validateConversationType = (type) => {
  const validTypes = ['direct', 'group'];
  if (!type || !validTypes.includes(type)) {
    return 'Conversation type must be either direct or group';
  }
  return null;
};

export const validateParticipantIds = (participantIds) => {
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

/**
 * Notification validation utilities
 */

export const validateNotificationType = (type) => {
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

export const validateNotificationTitle = (title) => {
  if (!title || !title.trim()) {
    return 'Notification title is required';
  }
  if (title.length > 255) {
    return 'Notification title must be less than 255 characters';
  }
  return null;
};

export const validateNotificationMessage = (message) => {
  if (!message || !message.trim()) {
    return 'Notification message is required';
  }
  if (message.length > 1000) {
    return 'Notification message must be less than 1000 characters';
  }
  return null;
};

export const validateRelatedEntityType = (entityType) => {
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

/**
 * Post validation utilities
 */

const validatePostContent = (content) => {
  if (!content || !content.trim()) {
    return 'Post content is required';
  }
  if (content.length > 2000) {
    return 'Post content must be less than 2000 characters';
  }
  return null;
};

const validateImageUrl = (imageUrl) => {
  if (!imageUrl) return null; // Optional field
  
  if (typeof imageUrl !== 'string') {
    return 'Image URL must be a string';
  }
  
  if (imageUrl.length > 500) {
    return 'Image URL must be less than 500 characters';
  }
  
  // Basic URL validation
  try {
    new URL(imageUrl);
  } catch (e) {
    return 'Image URL must be a valid URL';
  }
  
  return null;
};

const validateVisibility = (visibility) => {
  const validVisibilities = ['public', 'friends', 'private'];
  
  if (!visibility) {
    return null; // Will use default value
  }
  
  if (!validVisibilities.includes(visibility)) {
    return `Visibility must be one of: ${validVisibilities.join(', ')}`;
  }
  
  return null;
};

export const validateCreatePost = (data) => {
  const errors = {};
  
  const contentError = validatePostContent(data.content);
  if (contentError) errors.content = contentError;
  
  if (data.imageUrl !== undefined) {
    const imageError = validateImageUrl(data.imageUrl);
    if (imageError) errors.imageUrl = imageError;
  }
  
  if (data.visibility !== undefined) {
    const visibilityError = validateVisibility(data.visibility);
    if (visibilityError) errors.visibility = visibilityError;
  }
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: 'Validation failed', errors }, data: null };
  }
  
  return { error: null, data };
};

export const validateUpdatePost = (data) => {
  const errors = {};
  
  // At least one field must be provided
  if (!data.content && data.imageUrl === undefined && data.visibility === undefined) {
    errors.general = 'At least one field must be provided for update';
  }
  
  if (data.content !== undefined) {
    const contentError = validatePostContent(data.content);
    if (contentError) errors.content = contentError;
  }
  
  if (data.imageUrl !== undefined) {
    const imageError = validateImageUrl(data.imageUrl);
    if (imageError) errors.imageUrl = imageError;
  }
  
  if (data.visibility !== undefined) {
    const visibilityError = validateVisibility(data.visibility);
    if (visibilityError) errors.visibility = visibilityError;
  }
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: 'Validation failed', errors }, data: null };
  }
  
  return { error: null, data };
};

/**
 * User validation utilities
 */
const validateRequired = (value, fieldName) => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
};

const validateAge = (age) => {
  const numAge = parseInt(age);
  if (!numAge || numAge < 13 || numAge > 120) {
    return 'Age must be between 13 and 120';
  }
  return null;
};

const validateEmail = (email) => {
  if (!email) return null; // Email is optional
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

const validateBio = (bio) => {
  if (!bio) return null; // Bio is optional
  
  if (bio.length > 500) {
    return 'Bio must be less than 500 characters';
  }
  return null;
};

export const validateSignup = (data) => {
  const errors = {};
  
  const firstNameError = validateRequired(data.firstName, 'First name');
  if (firstNameError) errors.firstName = firstNameError;
  
  const lastNameError = validateRequired(data.lastName, 'Last name');
  if (lastNameError) errors.lastName = lastNameError;
  
  const ageError = validateAge(data.age);
  if (ageError) errors.age = ageError;
  
  const locationError = validateRequired(data.location, 'Location');
  if (locationError) errors.location = locationError;
  
  const usernameError = validateUsername(data.username);
  if (usernameError) errors.username = usernameError;
  
  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;
  
  // Optional fields
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  
  const bioError = validateBio(data.bio);
  if (bioError) errors.bio = bioError;
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: 'Validation failed', errors }, data: null };
  }
  
  return { error: null, data };
};

export const validateProfileUpdate = (data) => {
  const errors = {};
  
  // All fields are optional for profile update
  if (data.firstName !== undefined) {
    const firstNameError = validateRequired(data.firstName, "First name");
    if (firstNameError) errors.firstName = firstNameError;
  }
  
  if (data.lastName !== undefined) {
    const lastNameError = validateRequired(data.lastName, "Last name");
    if (lastNameError) errors.lastName = lastNameError;
  }
  
  if (data.age !== undefined) {
    const ageError = validateAge(data.age);
    if (ageError) errors.age = ageError;
  }
  
  if (data.location !== undefined) {
    const locationError = validateRequired(data.location, "Location");
    if (locationError) errors.location = locationError;
  }
  
  if (data.username !== undefined) {
    const usernameError = validateUsername(data.username);
    if (usernameError) errors.username = usernameError;
  }
  
  // Password is optional for profile update
  if (data.password !== undefined && data.password !== "") {
    const passwordError = validatePassword(data.password, false);
    if (passwordError) errors.password = passwordError;
  }
  
  // Optional fields
  if (data.email !== undefined) {
    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;
  }
  
  if (data.bio !== undefined) {
    const bioError = validateBio(data.bio);
    if (bioError) errors.bio = bioError;
  }
  
  if (Object.keys(errors).length > 0) {
    return { error: { message: "Validation failed", errors }, data: null };
  }
  
  return { error: null, data };
};
