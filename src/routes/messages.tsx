import { createFileRoute } from "@tanstack/react-router";
import { MessagesPage } from "../components/messaging/MessagesPage";
import AuthenticatedLayout from "../components/layout/AuthenticatedLayout";

interface MessagesSearch {
  conversation?: string;
  /** Scroll to (and highlight) this message once the conversation opens. */
  message?: string;
}

const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value ? value : undefined;

export const Route = createFileRoute("/messages")({
  validateSearch: (search: Record<string, unknown>): MessagesSearch => {
    const conversation = optionalString(search.conversation);
    const message = optionalString(search.message);
    return {
      ...(conversation ? { conversation } : {}),
      ...(conversation && message ? { message } : {}),
    };
  },
  component: MessagesComponent,
});

function MessagesComponent() {
  const { conversation, message } = Route.useSearch();
  return (
    <AuthenticatedLayout>
      <MessagesPage
        initialConversationId={conversation ?? null}
        initialMessageId={message ?? null}
      />
    </AuthenticatedLayout>
  );
}
