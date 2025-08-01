import { Card } from "../common";
import "./EmptyState.css";

/**
 * Empty state component for when no data is available
 * @param {string} message - Message to display
 * @param {string} icon - Optional emoji or icon to display
 * @param {ReactNode} action - Optional action button or element
 */
function EmptyState({ message, icon = "👥", action = null }) {
  return (
    <Card className="empty-state">
      {icon && <span className="empty-state-icon">{icon}</span>}
      <p className="empty-state-message">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </Card>
  );
}

export default EmptyState;
