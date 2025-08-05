function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
      {message}
    </div>
  );
}

export default ErrorBanner;
