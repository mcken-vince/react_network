import "./Card.css";

/**
 * Reusable Card component for consistent card styling
 * @param {ReactNode} children - Content to be displayed in the card
 * @param {string} className - Additional CSS classes
 * @param {boolean} hoverable - Whether the card should have hover effects
 * @param {function} onClick - Optional click handler
 */
function Card({ children, className = "", hoverable = false, onClick = null }) {
  return (
    <div 
      className={`card ${hoverable ? "card-hoverable" : ""} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}

export default Card;
