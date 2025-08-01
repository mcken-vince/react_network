import "./Avatar.css";

/**
 * Reusable Avatar component
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} size - Avatar size: 'small', 'medium', or 'large'
 * @param {string} className - Additional CSS classes
 */
function Avatar({ firstName, lastName, size = "medium", className = "" }) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  
  return (
    <div className={`avatar avatar-${size} ${className}`}>
      {initials}
    </div>
  );
}

export default Avatar;
