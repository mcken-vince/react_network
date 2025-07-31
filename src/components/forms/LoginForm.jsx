import AuthCard from './common/AuthCard'
import FormField from './common/FormField'
import ErrorBanner from './common/ErrorBanner'
import SubmitButton from './common/SubmitButton'
import AuthModeSwitch from './common/AuthModeSwitch'
import { useFormState } from '../../hooks/useFormState'
import { validateLoginForm } from '../../utils/validation'
import './common/FormLayout.css'

const initialFormData = {
  username: '',
  password: ''
}

function LoginForm({ onLogin, onSwitchToSignup }) {
  const {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    setErrors,
    resetForm
  } = useFormState(initialFormData)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const validationErrors = validateLoginForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setIsSubmitting(false)
      return
    }

    const result = onLogin(formData)
    if (!result.success) {
      setErrors({ general: result.message })
    }
    setIsSubmitting(false)
  }

  const handleSwitchMode = () => {
    resetForm()
    onSwitchToSignup()
  }

  return (
    <AuthCard 
      title="Welcome Back" 
      subtitle="Sign in to your account"
    >
      <ErrorBanner message={errors.general} />
      
      <form onSubmit={handleSubmit} className="signup-form">
        <FormField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Choose a unique username"
          error={errors.username}
        />

        <FormField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          error={errors.password}
        />

        <SubmitButton
          isSubmitting={isSubmitting}
          submitText="Sign In"
          submittingText="Signing In..."
        />
      </form>

      <AuthModeSwitch 
        isLoginMode={true} 
        onSwitch={handleSwitchMode} 
      />
    </AuthCard>
  )
}

export default LoginForm
