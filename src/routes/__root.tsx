import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AuthProvider } from "../context/AuthProvider";
import { WebSocketProvider } from "../context/WebSocketProvider";
import { MessagingProvider } from "../context/MessagingProvider";
import ErrorBoundary from "../components/common/ErrorBoundary";
import RouteError from "../components/common/RouteError";
import NotFound from "../components/common/NotFound";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RouteError,
  pendingComponent: PendingComponent,
  notFoundComponent: NotFound,
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
        <LoadingSpinner
          size="lg"
          className="text-blue-600 mx-auto mb-4 h-12 w-12"
        />
        <h2 className="text-lg font-semibold text-gray-900">Loading...</h2>
      </div>
    </div>
  );
}
