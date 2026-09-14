import { Button, Flex, Text } from "../../atoms";

interface AuthModeSwitchProps {
  isLoginMode: boolean;
  onSwitch: () => void;
}

function AuthModeSwitch({ isLoginMode, onSwitch }: AuthModeSwitchProps) {
  return (
    <Flex
      justify="center"
      align="center"
      gap="small"
      className="pt-6 border-t border-gray-200"
    >
      <Text size="sm" color="gray-600">
        {isLoginMode ? "Don't have an account?" : "Already have an account?"}
      </Text>
      <Button
        type="button"
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
