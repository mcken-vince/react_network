import { Card } from "../common";
import { Text, Stack } from "../atoms";

/**
 * Empty state component for when no data is available
 * @param {string} message - Message to display
 * @param {string} icon - Optional emoji or icon to display
 * @param {ReactNode} action - Optional action button or element
 */
function EmptyState({ message, icon = "👥", action = null }) {
  return (
    <Card className="flex flex-col items-center justify-center p-10 text-center min-h-[200px]">
      <Stack spacing="medium" className="items-center">
        {icon && <span className="text-5xl">{icon}</span>}
        <Text color="gray-600" className="m-0">
          {message}
        </Text>
        {action && <div>{action}</div>}
      </Stack>
    </Card>
  );
}

export default EmptyState;
