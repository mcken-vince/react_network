import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AuthProvider } from "../context/AuthContext";
import { WebSocketProvider } from "../context/WebSocketContext";
import { MessagingProvider } from "../context/MessagingContext";
import ErrorBoundary from "../components/common/ErrorBoundary";
import RouteError from "../components/common/RouteError";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RouteError,
  pendingComponent: PendingComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <MessagingProvider>
          <ErrorBoundary>
            <div className="app min-h-screen bg-slate-50">
              <Outlet />
              {import.meta.env.DEV && (
                <TanStackRouterDevtools position="bottom-right" />
              )}
            </div>
          </ErrorBoundary>
        </MessagingProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

function PendingComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
          <svg
            className="animate-spin h-12 w-12 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Loading...</h2>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mt-2 text-3xl font-semibold text-gray-900">
          Page Not Found
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Home
          </a>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
