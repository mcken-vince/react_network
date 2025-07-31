import { useState } from 'react'

export function useFormState(initialState) {
  const [formData, setFormData] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const resetForm = (newInitialState = initialState) => {
    setFormData(newInitialState)
    setErrors({})
    setIsSubmitting(false)
  }

  const setError = (field, message) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }))
  }

  const clearErrors = () => {
    setErrors({})
  }

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    resetForm,
    setError,
    clearErrors
  }
}
