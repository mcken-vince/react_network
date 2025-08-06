import { Button, Flex, Text } from "../../atoms";

/**
 * AuthModeSwitch component for switching between login and signup modes
 * @param {boolean} isLoginMode - Whether currently in login mode
 * @param {function} onSwitch - Function to call when switching modes
 */
function AuthModeSwitch({ isLoginMode, onSwitch }) {
  return (
    <Flex justify="center" align="center" gap="small" className="pt-6 border-t border-gray-200">
      <Text size="sm" color="gray-600">
        {isLoginMode
          ? "Don't have an account?"
          : "Already have an account?"}
      </Text>
      <Button
        variant="ghost"
        size="small"
        onClick={onSwitch}
        className="font-semibold text-primary-600 hover:text-primary-700"
      >
        {isLoginMode ? "Sign Up" : "Sign In"}
      </Button>
    </Flex>
  );
}

export default AuthModeSwitch;
