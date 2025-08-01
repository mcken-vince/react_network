import "./DashboardHeader.css";

/**
 * Dashboard header component
 * @param {object} user - Current logged-in user
 * @param {function} onLogout - Logout handler function
 * @param {string} appTitle - Application title to display
 */
function DashboardHeader({ user, onLogout, appTitle = "SocialConnect" }) {
  return (
    <header className="dashboard-header">
      <h1 className="dashboard-title">{appTitle}</h1>
      <div className="dashboard-user-info">
        <span className="welcome-message">Welcome, {user.firstName}!</span>
        <button 
          onClick={onLogout} 
          className="logout-button"
          aria-label="Logout"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
