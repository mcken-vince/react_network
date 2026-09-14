import { createFileRoute } from "@tanstack/react-router";
import { AuthenticatedLayout } from "../components/layout";
import { NotificationsPage } from "../components/notifications";

export const Route = createFileRoute("/notifications")({
  component: NotificationsRoute,
});

function NotificationsRoute() {
  return (
    <AuthenticatedLayout>
      <NotificationsPage />
    </AuthenticatedLayout>
  );
}
