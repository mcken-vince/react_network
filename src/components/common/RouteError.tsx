import React from "react";
import { Link, ErrorComponentProps } from "@tanstack/react-router";

interface RouteErrorProps extends ErrorComponentProps {
  reset?: () => void;
}

const RouteError: React.FC<RouteErrorProps> = ({ error, reset }) => {
  const actualError = error;

  // Get error details
  let errorMessage = "An unexpected error occurred";
  let errorDetails: string | null = null;
  let statusCode: number | null = null;

  if (actualError) {
    if (actualError instanceof Error) {
      errorMessage = actualError.message || errorMessage;
      errorDetails = actualError.stack || null;
    } else if (typeof actualError === "object" && actualError !== null) {
      // Handle API errors or other structured errors
      const err = actualError as any;
      if (err.status) {
        statusCode = err.status;
      }
      if (err.statusText) {
        errorMessage = err.statusText;
      }
      if (err.message) {
        errorMessage = err.message;
      }
      if (err.data?.message) {
        errorMessage = err.data.message;
      }
      if (err.error) {
        errorDetails = JSON.stringify(err.error, null, 2);
      }
    } else if (typeof actualError === "string") {
      errorMessage = actualError;
    }
  }

  // Determine if this is a 404 error
  const is404 = statusCode === 404 || errorMessage.toLowerCase().includes("not found");

  // Show different UI for development vs production
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white shadow-xl rounded-lg p-8">
          {/* Error Icon */}
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
              >
                {is404 ? (
                  <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h-.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                )}
              </svg>
            </div>
          </div>

          {/* Error Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {is404 ? "Page Not Found" : "Oops! Something went wrong"}
            </h1>
            {statusCode && !is404 && (
              <p className="text-lg text-gray-600 mb-4">Error {statusCode}</p>
            )}
          </div>

          {/* Error Message */}
          <div className="mt-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">
                {is404
                  ? "The page you're looking for doesn't exist or has been moved."
                  : errorMessage}
              </p>
            </div>
          </div>

          {/* Developer Details (only in development) */}
          {isDevelopment && errorDetails && !is404 && (
            <div className="mt-6">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Technical Details (Development Only)
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {errorDetails}
                  </pre>
                </div>
              </details>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {reset && (
              <button
                onClick={reset}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            )}
            
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              If this problem persists, please{" "}
              <a
                href="mailto:support@example.com"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteError;
