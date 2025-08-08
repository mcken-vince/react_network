import { Button, Flex, Heading, Text } from "../atoms";
import { NotificationBell } from "../notifications";

/**
 * Dashboard header component
 * @param {object} user - Current logged-in user
 * @param {function} onLogout - Logout handler function
 * @param {string} appTitle - Application title to display
 */
function DashboardHeader({ user, onLogout, appTitle = "SocialConnect" }) {
  return (
    <header className="bg-white px-6 py-4 shadow-sm">
      <Flex
        justify="between"
        align="center"
        className="flex-col md:flex-row gap-4"
      >
        <Heading level={2} color="primary-600" className="m-0">
          {appTitle}
        </Heading>

        <Flex align="center" gap="medium" className="flex-col md:flex-row">
          <Text weight="semibold">Welcome, {user.firstName}!</Text>
          <NotificationBell />
          <Button
            onClick={onLogout}
            variant="danger"
            size="medium"
            aria-label="Logout"
          >
            Logout
          </Button>
        </Flex>
      </Flex>
    </header>
  );
}

export default DashboardHeader;
