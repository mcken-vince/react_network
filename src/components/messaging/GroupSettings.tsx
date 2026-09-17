import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { userAPI } from "../../lib/api";
import {
  useAddParticipants,
  useRemoveParticipant,
  useRenameConversation,
} from "../../hooks/useMessaging";
import type { Conversation, User } from "../../types";
import { Icon } from "../atoms";

interface GroupSettingsProps {
  conversation: Conversation;
  onClose: () => void;
  /** Called after the current user has left the group. */
  onLeft: () => void;
}

export function GroupSettings({
  conversation,
  onClose,
  onLeft,
}: GroupSettingsProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const participants = conversation.participants ?? [];
  const isAdmin = participants.some(
    (p) => p.userId === currentUserId && p.isAdmin,
  );

  const rename = useRenameConversation();
  const addParticipants = useAddParticipants();
  const removeParticipant = useRemoveParticipant();

  const [name, setName] = useState(conversation.name ?? "");
  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Debounced member search, excluding people already in the group.
  useEffect(() => {
    const q = queryText.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const memberIds = new Set(participants.map((p) => p.userId));
    const id = setTimeout(() => {
      userAPI
        .searchUsers(q)
        .then((res) => {
          if (!cancelled) {
            setResults(res.users.filter((u) => !memberIds.has(u.id)));
          }
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryText, conversation.participants]);

  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return false;
    }
  };

  const busy =
    rename.isPending ||
    addParticipants.isPending ||
    removeParticipant.isPending;

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Group settings</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close group settings"
        >
          <Icon name="close" size="small" />
        </button>
      </div>

      {isAdmin && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = name.trim();
            if (!trimmed || trimmed === conversation.name) return;
            void run(() =>
              rename.mutateAsync({
                conversationId: conversation.id,
                name: trimmed,
              }),
            );
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            aria-label="Group name"
          />
          <button
            type="submit"
            disabled={busy || !name.trim() || name.trim() === conversation.name}
            className="px-3 py-2 rounded-md text-white bg-primary-600 disabled:bg-gray-300"
          >
            Rename
          </button>
        </form>
      )}

      <div>
        <p className="font-medium text-gray-700 mb-2">
          Members ({participants.length})
        </p>
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between px-3 py-2"
            >
              <span className="text-gray-900">
                {p.user
                  ? `${p.user.firstName} ${p.user.lastName}`
                  : `User #${p.userId}`}
                {p.userId === currentUserId && (
                  <span className="text-gray-500"> (you)</span>
                )}
                {p.isAdmin && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-primary-100 text-primary-800">
                    admin
                  </span>
                )}
              </span>
              {isAdmin && p.userId !== currentUserId && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(() =>
                      removeParticipant.mutateAsync({
                        conversationId: conversation.id,
                        userId: p.userId,
                      }),
                    )
                  }
                  className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isAdmin && (
        <div>
          <p className="font-medium text-gray-700 mb-2">Add members</p>
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search users…"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {results.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white divide-y divide-gray-100">
              {results.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span>
                    {u.firstName} {u.lastName}{" "}
                    <span className="text-gray-500">@{u.username}</span>
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await addParticipants.mutateAsync({
                          conversationId: conversation.id,
                          userIds: [u.id],
                        });
                        setQueryText("");
                      })
                    }
                    className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {currentUserId !== undefined && (
        <div className="pt-2 border-t border-gray-200">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Leave this group?")) return;
              void run(() =>
                removeParticipant.mutateAsync({
                  conversationId: conversation.id,
                  userId: currentUserId,
                }),
              ).then((ok) => {
                if (ok) onLeft();
              });
            }}
            className="text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Leave group
          </button>
        </div>
      )}
    </div>
  );
}
