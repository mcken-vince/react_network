import { useState } from "react";
import { Input, Button, Stack, Flex, Text } from "../atoms";
import { Card } from "../common";
import {
  useUsersWithConnectionStatus,
  usePrefetchUser,
} from "../../hooks/useUsers";
import { useSendConnectionRequest } from "../../hooks/useConnections";
import UserSearchResult from "./UserSearchResult";

const UserSearchForm = ({ currentUser, onConnectionUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // React Query hooks
  const { data: usersWithStatus = [], isLoading: loading } =
    useUsersWithConnectionStatus();
  const sendRequestMutation = useSendConnectionRequest();
  const prefetchUser = usePrefetchUser();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setHasSearched(true);

    // Filter users based on search term and exclude current user
    const filtered = usersWithStatus.filter((user) => {
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

    setFilteredResults(filtered);
  };

  const handleSendRequest = async (userId) => {
    try {
      await sendRequestMutation.mutateAsync(userId);
      onConnectionUpdate();
    } catch (error) {
      console.error("Error sending connection request:", error);
    }
  };

  // Get the search results to display
  const searchResults = hasSearched ? filteredResults : [];

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
                  onMouseEnter={() => prefetchUser(user.id)}
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
