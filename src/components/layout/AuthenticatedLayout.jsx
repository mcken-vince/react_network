import { Link, useLocation } from "@tanstack/react-router";
import { Button, Flex, Heading, Text } from "../atoms";
import { NotificationBell } from "../notifications";
import { useAuth } from "../../hooks/useAuth";

/**
 * Layout component for authenticated users with persistent navigation
 * @param {React.ReactNode} children - The page content to render
 */
function AuthenticatedLayout({ children }) {
  const { user, handleLogout } = useAuth();
  const location = useLocation();

  const isActiveRoute = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const getLinkClassName = (path) => {
    const baseClasses =
      "px-3 py-2 rounded-md font-medium transition-colors duration-200";
    return isActiveRoute(path)
      ? `${baseClasses} text-primary-600 bg-primary-50`
      : `${baseClasses} text-gray-600 hover:text-primary-600`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-50">
        <Flex
          justify="between"
          align="center"
          className="flex-col md:flex-row gap-4"
        >
          {/* Logo/Brand */}
          <Link to="/dashboard" className="no-underline">
            <Heading level={2} color="primary-600" className="m-0">
              SocialConnect
            </Heading>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex">
            <Flex align="center" gap="large">
              <Link to="/dashboard" className={getLinkClassName("/dashboard")}>
                Dashboard
              </Link>
              <Link
                to="/connections"
                className={getLinkClassName("/connections")}
              >
                Connections
              </Link>
              <Link
                to="/notifications"
                className={getLinkClassName("/notifications")}
              >
                Notifications
              </Link>
              <Link
                to={`/profile/${user.id}`}
                className={getLinkClassName("/profile")}
              >
                Profile
              </Link>
            </Flex>
          </nav>

          {/* User Actions */}
          <Flex align="center" gap="medium" className="flex-col md:flex-row">
            <Text weight="semibold" className="text-sm">
              Welcome, {user.firstName}!
            </Text>
            <NotificationBell />
            <Button
              onClick={handleLogout}
              variant="danger"
              size="medium"
              aria-label="Logout"
            >
              Logout
            </Button>
          </Flex>
        </Flex>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 pt-4 border-t border-gray-200">
          <Flex justify="center" gap="medium" wrap="wrap">
            <Link
              to="/dashboard"
              className={getLinkClassName("/dashboard") + " text-sm"}
            >
              Dashboard
            </Link>
            <Link
              to="/connections"
              className={getLinkClassName("/connections") + " text-sm"}
            >
              Connections
            </Link>
            <Link
              to="/notifications"
              className={getLinkClassName("/notifications") + " text-sm"}
            >
              Notifications
            </Link>
            <Link
              to={`/profile/${user.id}`}
              className={getLinkClassName("/profile") + " text-sm"}
            >
              Profile
            </Link>
          </Flex>
        </nav>
      </header>

      {/* Page Content */}
      <main className="min-h-screen">{children}</main>
    </div>
  );
}

export default AuthenticatedLayout;
