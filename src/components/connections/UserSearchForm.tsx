import { useState, type ChangeEvent } from "react";
import { Button, Flex, Input, Stack, Text } from "../atoms";
import { Card } from "../common";
import { usePrefetchUser, useSearchUsers } from "../../hooks/useUsers";
import { useSendConnectionRequest } from "../../hooks/useConnections";
import { useRefreshNotifications } from "../../hooks/useNotifications";
import UserSearchResult from "./UserSearchResult";
import type { User } from "../../types";

interface UserSearchFormProps {
  currentUser: User;
}

/** Server-side search against /users/search (the server never returns the caller). */
const UserSearchForm = (_props: UserSearchFormProps) => {
  const [term, setTerm] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data: results = [], isLoading, isError } = useSearchUsers(submitted);
  const sendRequest = useSendConnectionRequest();
  const refreshNotifications = useRefreshNotifications();
  const prefetchUser = usePrefetchUser();

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
            setSubmitted(term.trim());
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
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </Flex>
          </Stack>
        </form>
      </Card>

      {submitted && (
        <Stack spacing="md">
          {isLoading ? (
            <Card>
              <Text color="muted" className="text-center py-4">
                Searching…
              </Text>
            </Card>
          ) : isError ? (
            <Card>
              <Text color="red-600" className="text-center py-4">
                Search failed. Please try again.
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
