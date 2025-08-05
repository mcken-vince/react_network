/**
 * Reusable UserInfo component for displaying user details
 * @param {object} user - User object containing user information
 * @param {string} variant - Display variant: 'compact' or 'detailed'
 * @param {string} className - Additional CSS classes
 */
function UserInfo({ user, variant = "compact", className = "" }) {
  const { firstName, lastName, username, location, age } = user;
  const fullName = `${firstName} ${lastName}`;

  const variantStyles = {
    compact: {
      name: "text-[1.1rem] mb-1",
      info: "text-sm my-0.5"
    },
    detailed: {
      name: "text-[1.3rem] mb-2",
      info: "text-sm my-1"
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className={`flex flex-col ${className}`}>
      <h3 className={`m-0 text-gray-800 font-semibold ${styles.name}`}>{fullName}</h3>
      <p className={`text-gray-600 ${styles.info}`}>@{username}</p>
      <p className={`text-gray-600 ${styles.info}`}>📍 {location}</p>
      {variant === "detailed" && age && (
        <p className={`text-gray-600 ${styles.info}`}>🎂 {age} years old</p>
      )}
    </div>
  );
}

export default UserInfo;
