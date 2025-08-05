function AuthModeSwitch({ isLoginMode, onSwitch }) {
  return (
    <div className="text-center mt-6">
      <p className="text-gray-600">
        {isLoginMode ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-primary-600 font-semibold hover:text-primary-700 focus:outline-none focus:underline transition-colors duration-200"
        >
          {isLoginMode ? "Sign Up" : "Sign In"}
        </button>
      </p>
    </div>
  );
}

export default AuthModeSwitch;
