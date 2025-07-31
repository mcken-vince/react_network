import './Dashboard.css'

function Dashboard({ user, onLogout, allUsers }) {
  const otherUsers = allUsers.filter(u => u.id !== user.id)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>SocialConnect</h1>
        <div className="user-info">
          <span>Welcome, {user.firstName}!</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="profile-section">
          <h2>Your Profile</h2>
          <div className="profile-card">
            <div className="profile-avatar">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="profile-details">
              <h3>{user.firstName} {user.lastName}</h3>
              <p>@{user.username}</p>
              <p>📍 {user.location}</p>
              <p>🎂 {user.age} years old</p>
            </div>
          </div>
        </div>

        <div className="users-section">
          <h2>Other Users ({otherUsers.length})</h2>
          {otherUsers.length === 0 ? (
            <p className="no-users">No other users yet. Invite your friends!</p>
          ) : (
            <div className="users-grid">
              {otherUsers.map(u => (
                <div key={u.id} className="user-card">
                  <div className="user-avatar">
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                  <div className="user-details">
                    <h4>{u.firstName} {u.lastName}</h4>
                    <p>@{u.username}</p>
                    <p>📍 {u.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard