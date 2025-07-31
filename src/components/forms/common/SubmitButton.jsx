import './SubmitButton.css'

function SubmitButton({ 
  isSubmitting, 
  submitText, 
  submittingText, 
  className = 'signup-button',
  disabled = false 
}) {
  return (
    <button 
      type="submit" 
      className={className}
      disabled={isSubmitting || disabled}
    >
      {isSubmitting ? submittingText : submitText}
    </button>
  )
}

export default SubmitButton
