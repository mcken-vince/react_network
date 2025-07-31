import './AuthModeSwitch.css'

function AuthModeSwitch({ isLoginMode, onSwitch }) {
  return (
    <div className="switch-mode">
      <p>
        {isLoginMode ? "Don't have an account? " : "Already have an account? "}
        <button type="button" onClick={onSwitch} className="switch-button">
          {isLoginMode ? 'Sign Up' : 'Sign In'}
        </button>
      </p>
    </div>
  )
}

export default AuthModeSwitch
