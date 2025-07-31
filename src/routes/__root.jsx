import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AuthProvider } from "../context/AuthContext";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <div className="app">
        <Outlet />
      </div>
    </AuthProvider>
  );
}
