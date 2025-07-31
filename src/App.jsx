import './App.css'
import AuthContainer from './components/forms/AuthContainer'
import Dashboard from './components/Dashboard'
import { useLocalStorage } from './hooks/useLocalStorage'

function App() {
  const [user, setUser, userLoading] = useLocalStorage('socialconnect-current-user', null)
  const [users, setUsers, usersLoading] = useLocalStorage('socialconnect-users', [])

  const isLoading = userLoading || usersLoading

  const handleSignup = (userData) => {
    // Check if username is unique
    const usernameExists = users.some(u => u.username === userData.username)
    if (usernameExists) {
      return { success: false, message: 'Username already exists' }
    }

    const newUser = {
      ...userData,
      id: Date.now(),
      // Remove confirmPassword from stored user data
      confirmPassword: undefined
    }
    setUsers(prev => [...prev, newUser])
    setUser(newUser)
    return { success: true }
  }

  const handleLogin = (credentials) => {
    const foundUser = users.find(u =>
      u.username === credentials.username && u.password === credentials.password
    )

    if (!foundUser) {
      return { success: false, message: 'Invalid username or password' }
    }

    setUser(foundUser)
    return { success: true }
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="app loading">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#667eea'
        }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {!user ? (
        <AuthContainer
          onSignup={handleSignup}
          onLogin={handleLogin}
        />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} allUsers={users} />
      )}
    </div>
  )
}

export default App