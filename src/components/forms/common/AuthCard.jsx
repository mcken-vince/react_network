import './AuthCard.css'

function AuthCard({ title, subtitle, children }) {
  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
    </div>
  )
}

export default AuthCard
