import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AuthProvider } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";
import { MessagingProvider } from "../context/MessagingContext.jsx";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MessagingProvider>
          <div className="app">
            <Outlet />
          </div>
        </MessagingProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
