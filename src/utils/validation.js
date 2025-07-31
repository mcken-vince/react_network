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

export const validateRequired = (value, fieldName) => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`
  }
  return null
}

export const validateAge = (age) => {
  if (!age || age < 13 || age > 120) {
    return 'Age must be between 13 and 120'
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

export const validateSignupForm = (formData) => {
  const errors = {}
  
  const firstNameError = validateRequired(formData.firstName, 'First name')
  if (firstNameError) errors.firstName = firstNameError
  
  const lastNameError = validateRequired(formData.lastName, 'Last name')
  if (lastNameError) errors.lastName = lastNameError
  
  const ageError = validateAge(formData.age)
  if (ageError) errors.age = ageError
  
  const locationError = validateRequired(formData.location, 'Location')
  if (locationError) errors.location = locationError
  
  const usernameError = validateUsername(formData.username)
  if (usernameError) errors.username = usernameError
  
  const passwordError = validatePassword(formData.password)
  if (passwordError) errors.password = passwordError
  
  const confirmPasswordError = validatePasswordMatch(formData.password, formData.confirmPassword)
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError
  
  return errors
}
