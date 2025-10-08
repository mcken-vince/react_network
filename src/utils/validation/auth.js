/**
 * Authentication validation utilities
 */

export const validateUsername = (username) => {
  if (!username.trim()) {
    return 'Username is required'
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters'
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores'
  }
  return null
}

export const validatePassword = (password, isRequired = true) => {
  if (!password && isRequired) {
    return 'Password is required'
  }
  if (password && password.length < 6) {
    return 'Password must be at least 6 characters'
  }
  return null
}

export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return 'Passwords do not match'
  }
  return null
}

export const validateLoginForm = (formData) => {
  const errors = {}
  
  const usernameError = validateUsername(formData.username)
  if (usernameError) errors.username = usernameError
  
  const passwordError = validatePassword(formData.password)
  if (passwordError) errors.password = passwordError
  
  return errors
}
