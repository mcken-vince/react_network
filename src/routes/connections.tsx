import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/Loading";
import { AuthenticatedLayout } from "../components/layout";
import ConnectionsPage from "../components/connections/ConnectionsPage";
import type { ConnectionsTab } from "../lib/notifications";

const TABS: ConnectionsTab[] = ["search", "requests", "sent", "connections"];

interface ConnectionsSearch {
  tab: ConnectionsTab;
  highlight?: number;
}

export const Route = createFileRoute("/connections")({
  validateSearch: (search: Record<string, unknown>): ConnectionsSearch => {
    const tab = TABS.includes(search.tab as ConnectionsTab)
      ? (search.tab as ConnectionsTab)
      : "search";
    const highlight = Number(search.highlight);
    return {
      tab,
      ...(Number.isInteger(highlight) && highlight > 0 ? { highlight } : {}),
    };
  },
  component: ConnectionsRoute,
});

function ConnectionsRoute() {
  const { user, isLoading } = useAuth();
  const { tab, highlight } = Route.useSearch();
  const navigate = useNavigate();

  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" />;

  return (
    <AuthenticatedLayout>
      <ConnectionsPage
        user={user}
        tab={tab}
        highlightConnectionId={highlight ?? null}
        onTabChange={(next) =>
          navigate({ to: "/connections", search: { tab: next }, replace: true })
        }
      />
    </AuthenticatedLayout>
  );
}
