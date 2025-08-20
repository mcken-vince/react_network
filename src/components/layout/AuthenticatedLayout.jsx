import { Link, useLocation } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Button, Flex, Heading, Text, IconButton } from "../atoms";
import { NotificationBell } from "../notifications";
import { useAuth } from "../../hooks/useAuth";

/**
 * Layout component for authenticated users with persistent navigation
 * @param {React.ReactNode} children - The page content to render
 */
function AuthenticatedLayout({ children }) {
  const { user, handleLogout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isActiveRoute = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const getLinkClassName = (path) => {
    const baseClasses =
      "block px-4 py-3 text-left font-medium transition-colors duration-200 w-full border-none bg-transparent";
    return isActiveRoute(path)
      ? `${baseClasses} text-primary-600 bg-primary-50`
      : `${baseClasses} text-gray-700 hover:text-primary-600 hover:bg-gray-50`;
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { path: "/connections", label: "Connections", icon: "connections" },
    { path: "/notifications", label: "Notifications", icon: "notifications" },
    { path: `/profile/${user.id}`, label: "Profile", icon: "profile" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-50">
        <Flex justify="between" align="center">
          {/* Logo/Brand */}
          <Link to="/dashboard" className="no-underline">
            <Heading
              level={2}
              color="primary-600"
              className="m-0 text-lg md:text-xl"
            >
              SocialConnect
            </Heading>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex">
            <Flex align="center" gap="medium">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md font-medium transition-colors duration-200 ${
                    isActiveRoute(item.path)
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </Flex>
          </nav>

          {/* Desktop User Actions - Hidden on mobile */}
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

          {/* Mobile Menu Button */}
          <div className="lg:hidden relative" ref={menuRef}>
            <IconButton
              icon={isMenuOpen ? "close" : "menu"}
              onClick={toggleMenu}
              size="medium"
              ariaLabel={isMenuOpen ? "Close menu" : "Open menu"}
              className="relative z-50"
            />

            {/* Mobile Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <Text weight="semibold" className="text-sm text-gray-900">
                    Welcome, {user.firstName}!
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {user.email}
                  </Text>
                </div>

                {/* Navigation Links */}
                <nav className="py-2">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={getLinkClassName(item.path)}
                    >
                      <Flex align="center" gap="small">
                        <span className="text-base">
                          {item.icon === "dashboard"
                            ? "📊"
                            : item.icon === "connections"
                              ? "🔗"
                              : item.icon === "notifications"
                                ? "🔔"
                                : "👤"}
                        </span>
                        <span>{item.label}</span>
                      </Flex>
                    </Link>
                  ))}
                </nav>

                {/* Notifications Section */}
                <div className="px-4 py-3 border-t border-gray-200">
                  <Flex align="center" justify="between">
                    <Text weight="semibold" className="text-sm text-gray-900">
                      Notifications
                    </Text>
                    <NotificationBell />
                  </Flex>
                </div>

                {/* Logout Button */}
                <div className="px-4 py-3 border-t border-gray-200">
                  <Button
                    onClick={handleLogout}
                    variant="danger"
                    size="medium"
                    className="w-full"
                    aria-label="Logout"
                  >
                    <Flex align="center" gap="small" justify="center">
                      <span>🚪</span>
                      <span>Logout</span>
                    </Flex>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Flex>
      </header>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-30 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Page Content */}
      <main className="min-h-screen">{children}</main>
    </div>
  );
}

export default AuthenticatedLayout;
