import { Link, Navigate, useLocation } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Button, Flex, Heading, Text, IconButton } from "../atoms";
import { NotificationBell } from "../notifications";
import { useAuth } from "../../hooks/useAuth";
import Loading from "../Loading";

/**
 * Layout for authenticated pages. Owns the auth guard: renders Loading while
 * the session resolves and redirects to /login when there is no user.
 */
function AuthenticatedLayout({ children }) {
  const { user, isLoading, handleLogout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // ---- Guard (after all hooks) ----
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" />;

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", emoji: "📊" },
    { path: "/feed", label: "Feed", emoji: "📰" },
    { path: "/connections", label: "Connections", emoji: "🔗" },
    { path: "/messages", label: "Messages", emoji: "💬" },
    { path: "/notifications", label: "Notifications", emoji: "🔔" },
    { path: `/profile/${user.id}`, label: "Profile", emoji: "👤" },
  ];

  const isActiveRoute = (path) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  const mobileLinkClass = (path) =>
    `block px-4 py-3 text-left font-medium transition-colors duration-200 w-full ${
      isActiveRoute(path)
        ? "text-primary-600 bg-primary-50"
        : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
    }`;

  const desktopLinkClass = (path) =>
    `px-3 py-2 rounded-md font-medium transition-colors duration-200 ${
      isActiveRoute(path)
        ? "text-primary-600 bg-primary-50"
        : "text-gray-600 hover:text-primary-600"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-50">
        <Flex justify="between" align="center">
          <Link to="/dashboard" className="no-underline">
            <Heading
              level={2}
              color="primary-600"
              className="m-0 text-lg md:text-xl"
            >
              SocialConnect
            </Heading>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex">
            <Flex align="center" gap="medium">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={desktopLinkClass(item.path)}
                >
                  {item.label}
                </Link>
              ))}
            </Flex>
          </nav>

          {/* Desktop user actions */}
          <Flex align="center" gap="medium" className="hidden lg:flex">
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

          {/* Mobile menu */}
          <div className="lg:hidden relative" ref={menuRef}>
            <IconButton
              icon={isMenuOpen ? "close" : "menu"}
              onClick={() => setIsMenuOpen((open) => !open)}
              size="medium"
              ariaLabel={isMenuOpen ? "Close menu" : "Open menu"}
              className="relative z-50"
            />

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40">
                <div className="px-4 py-3 border-b border-gray-200">
                  <Text weight="semibold" className="text-sm text-gray-900">
                    Welcome, {user.firstName}!
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    @{user.username}
                  </Text>
                </div>

                <nav className="py-2">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={mobileLinkClass(item.path)}
                    >
                      <Flex align="center" gap="small">
                        <span className="text-base">{item.emoji}</span>
                        <span>{item.label}</span>
                      </Flex>
                    </Link>
                  ))}
                </nav>

                <div className="px-4 py-3 border-t border-gray-200">
                  <Flex align="center" justify="between">
                    <Text weight="semibold" className="text-sm text-gray-900">
                      Notifications
                    </Text>
                    <NotificationBell />
                  </Flex>
                </div>

                <div className="px-4 py-3 border-t border-gray-200">
                  <Button
                    onClick={handleLogout}
                    variant="danger"
                    size="medium"
                    className="w-full"
                    aria-label="Logout"
                  >
                    🚪 Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Flex>
      </header>

      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-30 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <main className="min-h-screen">{children}</main>
    </div>
  );
}

export default AuthenticatedLayout;
