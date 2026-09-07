import { useMemo, useState, type ChangeEvent } from "react";
import { Button, Flex, Input, Stack, Text } from "../atoms";
import { Card } from "../common";
import {
  usePrefetchUser,
  useUsersWithConnectionStatus,
} from "../../hooks/useUsers";
import { useSendConnectionRequest } from "../../hooks/useConnections";
import { useRefreshNotifications } from "../../hooks/useNotifications";
import UserSearchResult from "./UserSearchResult";
import type { User } from "../../types";

interface UserSearchFormProps {
  currentUser: User;
}

const UserSearchForm = ({ currentUser }: UserSearchFormProps) => {
  const [term, setTerm] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data: users = [], isLoading } = useUsersWithConnectionStatus();
  const sendRequest = useSendConnectionRequest();
  const refreshNotifications = useRefreshNotifications();
  const prefetchUser = usePrefetchUser();

  const results = useMemo(() => {
    const q = submitted.trim().toLowerCase();
    if (!q) return [];
    return users.filter((user) => {
      if (user.id === currentUser.id) return false;
      const haystack =
        `${user.firstName} ${user.lastName} ${user.username} ${user.location ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, submitted, currentUser.id]);

  const handleSend = async (userId: number): Promise<void> => {
    try {
      await sendRequest.mutateAsync(userId);
      refreshNotifications();
    } catch (error) {
      console.error("Error sending connection request:", error);
    }
  };

  return (
    <Stack spacing="lg">
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(term);
          }}
        >
          <Stack spacing="md">
            <Text size="lg" weight="semibold">
              Search for Users
            </Text>
            <Flex gap="md">
              <Input
                type="text"
                placeholder="Search by name, username, or location..."
                value={term}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setTerm(e.target.value)
                }
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !term.trim()}>
                {isLoading ? "Loading..." : "Search"}
              </Button>
            </Flex>
          </Stack>
        </form>
      </Card>

      {submitted.trim() && (
        <Stack spacing="md">
          {isLoading ? (
            <Card>
              <Text color="muted" className="text-center py-4">
                Loading users…
              </Text>
            </Card>
          ) : results.length === 0 ? (
            <Card>
              <Text color="muted" className="text-center py-4">
                No users found matching “{submitted}”
              </Text>
            </Card>
          ) : (
            <>
              <Text size="sm" color="muted">
                Found {results.length} user{results.length !== 1 ? "s" : ""}
              </Text>
              {results.map((user) => (
                <UserSearchResult
                  key={user.id}
                  user={user}
                  onSendRequest={() => handleSend(user.id)}
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
