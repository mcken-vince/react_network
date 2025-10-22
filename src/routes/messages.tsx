import { createFileRoute } from "@tanstack/react-router";
import { MessagesPage } from "../components/messaging/MessagesPage";
import AuthenticatedLayout from "../components/layout/AuthenticatedLayout";

export const Route = createFileRoute("/messages")({
  component: MessagesComponent,
});

function MessagesComponent() {
  return (
    <AuthenticatedLayout>
      <MessagesPage />
    </AuthenticatedLayout>
  );
}
