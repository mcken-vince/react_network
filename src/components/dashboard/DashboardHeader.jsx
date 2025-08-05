/**
 * Dashboard header component
 * @param {object} user - Current logged-in user
 * @param {function} onLogout - Logout handler function
 * @param {string} appTitle - Application title to display
 */
function DashboardHeader({ user, onLogout, appTitle = "SocialConnect" }) {
  return (
    <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center">
      <h1 className="text-primary-600 m-0 text-2xl md:text-3xl font-bold">{appTitle}</h1>
      <div className="flex items-center gap-4 md:flex-row flex-col md:gap-4">
        <span className="font-semibold text-gray-800">Welcome, {user.firstName}!</span>
        <button 
          onClick={onLogout} 
          className="bg-red-600 text-white border-none px-4 py-2 rounded-md cursor-pointer font-medium transition-colors duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          aria-label="Logout"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
