import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

interface ErrorHandlerOptions {
  fallbackPath?: string;
  showNotification?: boolean;
  logToConsole?: boolean;
}

interface ErrorDetails {
  message: string;
  code?: string | number;
  details?: any;
}

/**
 * Custom hook for handling errors consistently across the application
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const navigate = useNavigate();
  const {
    fallbackPath = "/",
    showNotification = true,
    logToConsole = import.meta.env.DEV,
  } = options;

  const handleError = useCallback(
    (error: unknown, errorDetails?: ErrorDetails) => {
      // Log error in development
      if (logToConsole) {
        console.error("Error handled:", error, errorDetails);
      }

      // Extract error message
      let message = "An unexpected error occurred";
      let statusCode: number | undefined;

      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      } else if (error && typeof error === "object") {
        const err = error as any;
        if (err.message) message = err.message;
        if (err.status) statusCode = err.status;
        if (err.statusText) message = err.statusText;
        if (err.data?.message) message = err.data.message;
      }

      // Handle specific error codes
      if (statusCode === 401) {
        // Unauthorized - redirect to login
        navigate({ to: "/login" });
        return;
      }

      if (statusCode === 403) {
        // Forbidden - show appropriate message
        message = "You don't have permission to access this resource";
      }

      if (statusCode === 404) {
        // Not found - could redirect to 404 page
        message = "The requested resource was not found";
      }

      // Show notification if enabled
      if (showNotification && typeof window !== "undefined") {
        // You could integrate with a toast notification system here
        // For now, we'll use a simple alert in development
        if (import.meta.env.DEV) {
          console.warn(`Notification: ${message}`);
        }
      }

      // Log to error reporting service in production
      if (!import.meta.env.DEV && typeof window !== "undefined") {
        // Example: Send to error tracking service
        // logErrorToService(error, errorDetails);
      }

      return {
        message,
        statusCode,
        handled: true,
      };
    },
    [navigate, logToConsole, showNotification]
  );

  const resetError = useCallback(() => {
    // Reset any error state if needed
    // This could be used with React Query or other state management
    navigate({ to: fallbackPath });
  }, [navigate, fallbackPath]);

  return {
    handleError,
    resetError,
  };
}

/**
 * Type guard to check if an error is an API error
 */
export function isApiError(error: unknown): error is {
  status: number;
  statusText: string;
  data?: { message?: string };
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as any).status === "number"
  );
}

/**
 * Type guard to check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message === "Network request failed" ||
      error.message === "Failed to fetch" ||
      error.name === "NetworkError"
    );
  }
  return false;
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  if (isApiError(error)) {
    return error.data?.message || error.statusText || "API Error";
  }
  
  if (isNetworkError(error)) {
    return "Network connection error. Please check your internet connection.";
  }
  
  return "An unexpected error occurred";
}
