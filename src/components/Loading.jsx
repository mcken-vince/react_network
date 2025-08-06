import { Text, Flex } from "./atoms";

function Loading() {
  return (
    <Flex 
      justify="center" 
      align="center" 
      className="min-h-screen"
    >
      <Text 
        size="lg" 
        color="primary-600" 
        className="animate-pulse mb-0"
      >
        Loading...
      </Text>
    </Flex>
  );
}

export default Loading;
