import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { ApiError } from "../../lib/api";

const DEFAULT_MESSAGE = "An unexpected error occurred";

interface ErrorDescription {
  message: string;
  details: string | null;
  status: number | null;
}

/** Normalise whatever the router hands us into something renderable. */
function describeError(error: unknown): ErrorDescription {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      details: error.errors ? JSON.stringify(error.errors, null, 2) : null,
      status: error.status,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message || DEFAULT_MESSAGE,
      details: error.stack ?? null,
      status: null,
    };
  }
  if (typeof error === "string") {
    return { message: error, details: null, status: null };
  }
  if (typeof error === "object" && error !== null) {
    const e = error as {
      status?: unknown;
      statusText?: unknown;
      message?: unknown;
      data?: { message?: unknown };
    };
    const message =
      [e.data?.message, e.message, e.statusText].find(
        (v): v is string => typeof v === "string",
      ) ?? DEFAULT_MESSAGE;
    return {
      message,
      details: JSON.stringify(error, null, 2),
      status: typeof e.status === "number" ? e.status : null,
    };
  }
  return { message: DEFAULT_MESSAGE, details: null, status: null };
}

const RouteError = ({ error, reset }: ErrorComponentProps) => {
  const { message, details, status } = describeError(error);
  const is404 = status === 404 || /not found/i.test(message);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-100 p-4">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                {is404 ? (
                  <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h-.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                )}
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {is404 ? "Page Not Found" : "Oops! Something went wrong"}
            </h1>
            {status !== null && !is404 && (
              <p className="text-lg text-gray-600 mb-4">Error {status}</p>
            )}
          </div>

          <div className="mt-4">
            <div
              className="bg-red-50 border border-red-200 rounded-md p-4"
              role="alert"
            >
              <p className="text-sm text-red-800">
                {is404
                  ? "The page you're looking for doesn't exist or has been moved."
                  : message}
              </p>
            </div>
          </div>

          {import.meta.env.DEV && details && !is404 && (
            <div className="mt-6">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Technical Details (Development Only)
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {details}
                  </pre>
                </div>
              </details>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Go to Home
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteError;
