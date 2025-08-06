import { useState } from "react";
import { Input, Button, Stack, Flex, Text } from "../atoms";
import { Card } from "../common";
import { userAPI, connectionAPI } from "../../utils/api";
import UserSearchResult from "./UserSearchResult";

const UserSearchForm = ({ currentUser, onConnectionUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await userAPI.getAllUsers();
      const allUsers = response.users || response || [];

      // Filter users based on search term and exclude current user
      const filtered = allUsers.filter((user) => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const username = user.username.toLowerCase();
        const location = user.location?.toLowerCase() || "";

        return (
          user.id !== currentUser.id &&
          (fullName.includes(searchLower) ||
            username.includes(searchLower) ||
            location.includes(searchLower))
        );
      });

      // Get connection status for each user
      const resultsWithStatus = await Promise.all(
        filtered.map(async (user) => {
          try {
            const statusResponse = await connectionAPI.getConnectionStatus(
              user.id
            );
            return {
              ...user,
              connectionStatus: statusResponse.status,
            };
          } catch {
            return {
              ...user,
              connectionStatus: null,
            };
          }
        })
      );

      setSearchResults(resultsWithStatus);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await connectionAPI.sendConnectionRequest(userId);

      // Update the search results to reflect the new connection status
      setSearchResults((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                connectionStatus: {
                  status: "pending",
                  isRequester: true,
                },
              }
            : user
        )
      );

      onConnectionUpdate();
    } catch (error) {
      console.error("Error sending connection request:", error);
    }
  };

  return (
    <Stack spacing="lg">
      <Card>
        <form onSubmit={handleSearch}>
          <Stack spacing="md">
            <Text size="lg" weight="semibold">
              Search for Users
            </Text>
            <Flex gap="md">
              <Input
                type="text"
                placeholder="Search by name, username, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !searchTerm.trim()}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </Flex>
          </Stack>
        </form>
      </Card>

      {hasSearched && (
        <Stack spacing="md">
          {loading ? (
            <Card>
              <Text color="muted" className="text-center py-4">
                Searching for users...
              </Text>
            </Card>
          ) : searchResults.length === 0 ? (
            <Card>
              <Text color="muted" className="text-center py-4">
                No users found matching "{searchTerm}"
              </Text>
            </Card>
          ) : (
            <>
              <Text size="sm" color="muted">
                Found {searchResults.length} user
                {searchResults.length !== 1 ? "s" : ""}
              </Text>
              {searchResults.map((user) => (
                <UserSearchResult
                  key={user.id}
                  user={user}
                  onSendRequest={() => handleSendRequest(user.id)}
                />
              ))}
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default UserSearchForm;
