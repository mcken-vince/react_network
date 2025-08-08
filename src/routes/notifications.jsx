import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "../components/notifications";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});
