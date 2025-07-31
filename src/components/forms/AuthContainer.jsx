import { useState } from 'react'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

function AuthContainer({ onSignup, onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(false)

  const switchToLogin = () => setIsLoginMode(true)
  const switchToSignup = () => setIsLoginMode(false)

  if (isLoginMode) {
    return (
      <LoginForm 
        onLogin={onLogin}
        onSwitchToSignup={switchToSignup}
      />
    )
  }

  return (
    <SignupForm 
      onSignup={onSignup}
      onSwitchToLogin={switchToLogin}
    />
  )
}

export default AuthContainer
