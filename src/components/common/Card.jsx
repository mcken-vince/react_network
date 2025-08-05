/**
 * Reusable Card component for consistent card styling
 * @param {ReactNode} children - Content to be displayed in the card
 * @param {string} className - Additional CSS classes
 * @param {boolean} hoverable - Whether the card should have hover effects
 * @param {function} onClick - Optional click handler
 */
function Card({ children, className = "", hoverable = false, onClick = null }) {
  const baseClasses = "bg-white rounded-xl p-5 shadow-card transition-all duration-200";
  const hoverableClasses = hoverable 
    ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2" 
    : "";
  
  return (
    <div 
      className={`${baseClasses} ${hoverableClasses} ${className}`}
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
