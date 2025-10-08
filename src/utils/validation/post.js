/**
 * Post validation utilities
 */

export const validatePostContent = (content) => {
  if (!content || !content.trim()) {
    return 'Post content is required'
  }
  if (content.trim().length < 1) {
    return 'Post content cannot be empty'
  }
  if (content.length > 2000) {
    return 'Post content must be less than 2000 characters'
  }
  return null
}

export const validateImageUrl = (imageUrl) => {
  if (!imageUrl) return null // Image URL is optional
  
  if (typeof imageUrl !== 'string') {
    return 'Image URL must be a string'
  }
  
  if (imageUrl.length > 500) {
    return 'Image URL must be less than 500 characters'
  }
  
  // Basic URL validation
  try {
    new URL(imageUrl)
  } catch (e) {
    return 'Image URL must be a valid URL'
  }
  
  return null
}

export const validateVisibility = (visibility) => {
  const validVisibilities = ['public', 'friends', 'private']
  
  if (!visibility) {
    return null // Will use default value
  }
  
  if (!validVisibilities.includes(visibility)) {
    return `Visibility must be one of: ${validVisibilities.join(', ')}`
  }
  
  return null
}

export const validateCreatePost = (formData) => {
  const errors = {}
  
  const contentError = validatePostContent(formData.content)
  if (contentError) errors.content = contentError
  
  if (formData.imageUrl !== undefined) {
    const imageError = validateImageUrl(formData.imageUrl)
    if (imageError) errors.imageUrl = imageError
  }
  
  if (formData.visibility !== undefined) {
    const visibilityError = validateVisibility(formData.visibility)
    if (visibilityError) errors.visibility = visibilityError
  }
  
  return errors
}

export const validateUpdatePost = (formData) => {
  const errors = {}
  
  // At least one field must be provided
  if (!formData.content && formData.imageUrl === undefined && formData.visibility === undefined) {
    errors.general = 'At least one field must be provided for update'
  }
  
  if (formData.content !== undefined) {
    const contentError = validatePostContent(formData.content)
    if (contentError) errors.content = contentError
  }
  
  if (formData.imageUrl !== undefined) {
    const imageError = validateImageUrl(formData.imageUrl)
    if (imageError) errors.imageUrl = imageError
  }
  
  if (formData.visibility !== undefined) {
    const visibilityError = validateVisibility(formData.visibility)
    if (visibilityError) errors.visibility = visibilityError
  }
  
  return errors
}

export const getCharacterCount = (content) => {
  return content ? content.length : 0
}

export const getRemainingCharacters = (content, maxLength = 2000) => {
  const count = getCharacterCount(content)
  return maxLength - count
}

export const isContentTooLong = (content, maxLength = 2000) => {
  return getCharacterCount(content) > maxLength
}
