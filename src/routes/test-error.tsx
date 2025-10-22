import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { useErrorHandler } from "../hooks/useErrorHandler";

export const Route = createFileRoute("/test-error")({
  component: TestErrorPage,
});

function TestErrorPage() {
  const [errorType, setErrorType] = useState<string>("standard");
  const { handleError, resetError } = useErrorHandler();

  const throwError = () => {
    switch (errorType) {
      case "standard":
        throw new Error("This is a test error message");
      case "network":
        throw new Error("Network request failed");
      case "api":
        throw {
          status: 500,
          statusText: "Internal Server Error",
          data: { message: "Something went wrong on the server" },
        };
      case "unauthorized":
        throw {
          status: 401,
          statusText: "Unauthorized",
          data: { message: "You need to log in" },
        };
      case "notfound":
        throw {
          status: 404,
          statusText: "Not Found",
          data: { message: "The requested resource was not found" },
        };
      case "async":
        setTimeout(() => {
          throw new Error("Async error after 1 second");
        }, 1000);
        break;
      case "render":
        // This will trigger the error boundary
        return <ComponentThatThrows />;
      default:
        throw new Error("Unknown error type");
    }
  };

  const handleTestError = () => {
    try {
      throwError();
    } catch (error) {
      handleError(error);
    }
  };

  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Error Testing Page
          </h1>
          <p className="mt-2 text-gray-600">
            This page is only available in development mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Error Testing Page (Development Only)
          </h1>

          <div className="space-y-6">
            {/* Error Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Error Type to Test:
              </label>
              <select
                value={errorType}
                onChange={(e) => setErrorType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="standard">Standard Error</option>
                <option value="network">Network Error</option>
                <option value="api">API Error (500)</option>
                <option value="unauthorized">Unauthorized (401)</option>
                <option value="notfound">Not Found (404)</option>
                <option value="async">Async Error</option>
                <option value="render">Render Error (Error Boundary)</option>
              </select>
            </div>

            {/* Error Description */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Error Type Description:
              </h3>
              <p className="text-sm text-blue-800">
                {errorType === "standard" && "Throws a basic JavaScript Error object"}
                {errorType === "network" && "Simulates a network connection failure"}
                {errorType === "api" && "Simulates a server error response"}
                {errorType === "unauthorized" && "Simulates an authentication error"}
                {errorType === "notfound" && "Simulates a 404 not found error"}
                {errorType === "async" && "Throws an error after a delay"}
                {errorType === "render" && "Triggers the React Error Boundary"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleTestError}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Throw Error
              </button>

              <button
                onClick={resetError}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                Reset
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Testing Instructions:
              </h3>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Select an error type from the dropdown</li>
                <li>Click "Throw Error" to trigger the error</li>
                <li>Observe how the error is handled</li>
                <li>Use "Reset" to return to a clean state</li>
              </ol>
            </div>

            {/* Console Output Reminder */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-yellow-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold">Developer Note:</p>
                  <p>Check the browser console for detailed error logs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component that intentionally throws an error during render
function ComponentThatThrows() {
  throw new Error("This component always throws an error during render!");
  return <div>This will never render</div>;
}
