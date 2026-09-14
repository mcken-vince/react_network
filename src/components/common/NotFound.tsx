import { Link, linkOptions } from "@tanstack/react-router";

const SUGGESTIONS = [
  { label: "Dashboard", icon: "📊", link: linkOptions({ to: "/dashboard" }) },
  { label: "Feed", icon: "📰", link: linkOptions({ to: "/feed" }) },
  {
    label: "Connections",
    icon: "🤝",
    link: linkOptions({ to: "/connections", search: { tab: "search" } }),
  },
  { label: "Messages", icon: "💬", link: linkOptions({ to: "/messages" }) },
  { label: "Profile", icon: "👤", link: linkOptions({ to: "/profile" }) },
];

/** Rendered by the root route's `notFoundComponent` for any unmatched URL. */
function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full text-center">
        <div className="relative">
          <div className="text-[150px] sm:text-[200px] font-bold text-blue-100 select-none leading-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full p-8 shadow-lg">
              <svg
                className="w-20 h-20 text-blue-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h-.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Popular Pages
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-2xl mx-auto">
            {SUGGESTIONS.map((item) => (
              <Link
                key={item.label}
                {...item.link}
                className="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <span className="text-3xl mb-2">{item.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Go to Homepage
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
