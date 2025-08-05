/**
 * Reusable Avatar component
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} size - Avatar size: 'small', 'medium', or 'large'
 * @param {string} className - Additional CSS classes
 */
function Avatar({ firstName, lastName, size = "medium", className = "" }) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  
  const sizeClasses = {
    small: "w-10 h-10 text-sm",
    medium: "w-[50px] h-[50px] text-base",
    large: "w-20 h-20 text-2xl"
  };
  
  return (
    <div className={`rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      {initials}
    </div>
  );
}

export default Avatar;
