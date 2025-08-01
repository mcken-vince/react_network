import "./UserInfo.css";

/**
 * Reusable UserInfo component for displaying user details
 * @param {object} user - User object containing user information
 * @param {string} variant - Display variant: 'compact' or 'detailed'
 * @param {string} className - Additional CSS classes
 */
function UserInfo({ user, variant = "compact", className = "" }) {
  const { firstName, lastName, username, location, age } = user;
  const fullName = `${firstName} ${lastName}`;

  return (
    <div className={`user-info-details user-info-${variant} ${className}`}>
      <h3 className="user-name">{fullName}</h3>
      <p className="user-username">@{username}</p>
      <p className="user-location">📍 {location}</p>
      {variant === "detailed" && age && (
        <p className="user-age">🎂 {age} years old</p>
      )}
    </div>
  );
}

export default UserInfo;
