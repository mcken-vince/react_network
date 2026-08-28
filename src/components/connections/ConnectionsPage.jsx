import { useState } from "react";
import { Container, Heading, Stack, Flex } from "../atoms";
import { useNotifications } from "../../hooks/useNotificationsContext";
import {
  usePendingRequests,
  useSentRequests,
  useAcceptConnectionRequest,
  useRejectConnectionRequest,
  useRemoveConnection,
  useConnectionsList,
} from "../../hooks/useConnections";
import ConnectionRequestCard from "./ConnectionRequestCard";
import ConnectionCard from "./ConnectionCard";
import UserSearchForm from "./UserSearchForm";

const TABS = [
  { id: "search", label: "Find Users", icon: "🔍" },
  { id: "requests", label: "Requests", icon: "📥" },
  { id: "sent", label: "Sent", icon: "📤" },
  { id: "connections", label: "Connections", icon: "🤝" },
];

const ConnectionsPage = ({ user }) => {
  const { refreshNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState("search");

  const { data: pendingRequests = [], isLoading: isPendingLoading } =
    usePendingRequests();
  const { data: sentRequests = [], isLoading: isSentLoading } =
    useSentRequests();
  const { data: connections = [], isLoading: isConnectionsLoading } =
    useConnectionsList();

  const acceptRequestMutation = useAcceptConnectionRequest();
  const rejectRequestMutation = useRejectConnectionRequest();
  const removeConnectionMutation = useRemoveConnection();

  const loading = isPendingLoading || isSentLoading || isConnectionsLoading;

  const handleAcceptRequest = async (connectionId) => {
    try {
      await acceptRequestMutation.mutateAsync(connectionId);
      refreshNotifications();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleRejectRequest = async (connectionId) => {
    try {
      await rejectRequestMutation.mutateAsync(connectionId);
      refreshNotifications();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleCancelRequest = async (connectionId) => {
    try {
      await removeConnectionMutation.mutateAsync(connectionId);
    } catch (error) {
      console.error("Error cancelling request:", error);
    }
  };

  const handleRemoveConnection = async (connection) => {
    const other =
      connection.requesterId === user.id
        ? connection.recipient
        : connection.requester;
    const name = other ? `${other.firstName} ${other.lastName}` : "this user";
    if (!window.confirm(`Remove your connection with ${name}?`)) return;

    try {
      await removeConnectionMutation.mutateAsync(connection.id);
    } catch (error) {
      console.error("Error removing connection:", error);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <Flex justify="center" align="center" className="py-8">
          <div className="text-gray-500">Loading...</div>
        </Flex>
      );
    }

    switch (activeTab) {
      case "search":
        return (
          <UserSearchForm
            currentUser={user}
            onConnectionUpdate={refreshNotifications}
          />
        );

      case "requests":
        return (
          <Stack spacing="md">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending connection requests
              </div>
            ) : (
              pendingRequests.map((request) => (
                <ConnectionRequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => handleAcceptRequest(request.id)}
                  onReject={() => handleRejectRequest(request.id)}
                />
              ))
            )}
          </Stack>
        );

      case "sent":
        return (
          <Stack spacing="md">
            {sentRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sent connection requests
              </div>
            ) : (
              sentRequests.map((request) => (
                <ConnectionRequestCard
                  key={request.id}
                  request={request}
                  isSentRequest
                  onCancel={() => handleCancelRequest(request.id)}
                />
              ))
            )}
          </Stack>
        );

      case "connections":
        return (
          <Stack spacing="md">
            {connections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No connections yet
              </div>
            ) : (
              connections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  currentUserId={user.id}
                  onRemove={() => handleRemoveConnection(connection)}
                />
              ))
            )}
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Container size="medium" className="py-8">
      <Stack spacing="lg">
        <Heading level={1}>Connections</Heading>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.id === "requests" && pendingRequests.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs rounded-full px-2 py-1">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-h-[400px]">{renderTabContent()}</div>
      </Stack>
    </Container>
  );
};

export default ConnectionsPage;
