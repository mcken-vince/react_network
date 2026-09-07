import { createFileRoute } from "@tanstack/react-router";
import { MessagesPage } from "../components/messaging/MessagesPage";
import AuthenticatedLayout from "../components/layout/AuthenticatedLayout";

interface MessagesSearch {
  conversation?: string;
}

export const Route = createFileRoute("/messages")({
  validateSearch: (search: Record<string, unknown>): MessagesSearch =>
    typeof search.conversation === "string" && search.conversation
      ? { conversation: search.conversation }
      : {},
  component: MessagesComponent,
});

function MessagesComponent() {
  const { conversation } = Route.useSearch();
  return (
    <AuthenticatedLayout>
      <MessagesPage initialConversationId={conversation ?? null} />
    </AuthenticatedLayout>
  );
}
