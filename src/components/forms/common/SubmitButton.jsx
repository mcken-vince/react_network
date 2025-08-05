function SubmitButton({
  isSubmitting,
  submitText,
  submittingText,
  disabled = false,
}) {
  return (
    <button
      type="submit"
      className={`w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg transition-all duration-200 ${
        isSubmitting || disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-primary-700 hover:shadow-lg transform hover:-translate-y-0.5"
      } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
      disabled={isSubmitting || disabled}
    >
      {isSubmitting ? submittingText : submitText}
    </button>
  );
}

export default SubmitButton;
