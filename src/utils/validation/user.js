/**
 * User validation utilities
 */

import { validateUsername, validatePassword } from './auth.js'

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

export const validateEmail = (email) => {
  if (!email) return null // Email is optional
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }
  return null
}

export const validateBio = (bio) => {
  if (!bio) return null // Bio is optional
  
  if (bio.length > 500) {
    return 'Bio must be less than 500 characters'
  }
  return null
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
  
  // Optional fields
  const emailError = validateEmail(formData.email)
  if (emailError) errors.email = emailError
  
  const bioError = validateBio(formData.bio)
  if (bioError) errors.bio = bioError
  
  return errors
}

export const validateProfileUpdateForm = (formData) => {
  const errors = {}
  
  // All fields are optional for profile update
  if (formData.firstName !== undefined) {
    const firstNameError = validateRequired(formData.firstName, 'First name')
    if (firstNameError) errors.firstName = firstNameError
  }
  
  if (formData.lastName !== undefined) {
    const lastNameError = validateRequired(formData.lastName, 'Last name')
    if (lastNameError) errors.lastName = lastNameError
  }
  
  if (formData.age !== undefined) {
    const ageError = validateAge(formData.age)
    if (ageError) errors.age = ageError
  }
  
  if (formData.location !== undefined) {
    const locationError = validateRequired(formData.location, 'Location')
    if (locationError) errors.location = locationError
  }
  
  if (formData.username !== undefined) {
    const usernameError = validateUsername(formData.username)
    if (usernameError) errors.username = usernameError
  }
  
  // Password is optional for profile update
  if (formData.password !== undefined && formData.password !== '') {
    const passwordError = validatePassword(formData.password, false)
    if (passwordError) errors.password = passwordError
  }
  
  // Optional fields
  if (formData.email !== undefined) {
    const emailError = validateEmail(formData.email)
    if (emailError) errors.email = emailError
  }
  
  if (formData.bio !== undefined) {
    const bioError = validateBio(formData.bio)
    if (bioError) errors.bio = bioError
  }
  
  return errors
}
