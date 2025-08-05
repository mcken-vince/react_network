import { Card } from "../common";

/**
 * Empty state component for when no data is available
 * @param {string} message - Message to display
 * @param {string} icon - Optional emoji or icon to display
 * @param {ReactNode} action - Optional action button or element
 */
function EmptyState({ message, icon = "👥", action = null }) {
  return (
    <Card className="flex flex-col items-center justify-center p-10 text-center min-h-[200px]">
      {icon && <span className="text-5xl mb-4">{icon}</span>}
      <p className="text-gray-600 text-base m-0 mb-4">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

export default EmptyState;
