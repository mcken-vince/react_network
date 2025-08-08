import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AuthProvider } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="app">
          <Outlet />
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}
