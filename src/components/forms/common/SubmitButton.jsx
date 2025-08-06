import { Button } from "../../atoms";

/**
 * Submit button component for forms
 * Using the atomic Button component instead of duplicate code
 */
function SubmitButton({ 
  isSubmitting, 
  submitText, 
  submittingText,
  ...props 
}) {
  return (
    <Button
      type="submit"
      variant="primary"
      size="large"
      fullWidth
      isLoading={isSubmitting}
      loadingText={submittingText}
      {...props}
    >
      {submitText}
    </Button>
  );
}

export default SubmitButton;
