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
