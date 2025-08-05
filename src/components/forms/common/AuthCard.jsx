function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-secondary-600 p-5">
      <div className="bg-white rounded-2xl p-10 shadow-2xl w-full max-w-lg">
        <h1 className="text-center text-gray-800 mb-2 text-4xl font-bold">{title}</h1>
        <p className="text-center text-gray-600 mb-8">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export default AuthCard;
