import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { userAPI } from "../../lib/api";
import {
  useActiveConversation,
  useCreateDirectConversation,
  useCreateGroupConversation,
} from "../../hooks/useMessaging";
import type { User } from "../../types";

export function CreateConversationModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { setActiveConversationId } = useActiveConversation();
  const createDirect = useCreateDirectConversation();
  const createGroup = useCreateGroupConversation();

  const [type, setType] = useState<"direct" | "group">("direct");
  const [groupName, setGroupName] = useState("");
  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = queryText.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const id = setTimeout(() => {
      userAPI
        .searchUsers(q)
        .then((res) => {
          if (!cancelled) {
            setResults(res.users.filter((u) => u.id !== user?.id));
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
  }, [queryText, user?.id]);

  const toggle = (target: User): void => {
    if (type === "direct") {
      setSelected([target]);
      return;
    }
    setSelected((prev) =>
      prev.some((s) => s.id === target.id)
        ? prev.filter((s) => s.id !== target.id)
        : [...prev, target],
    );
  };

  const canCreate = useMemo(() => {
    if (selected.length === 0) return false;
    if (type === "group" && !groupName.trim()) return false;
    return true;
  }, [selected, type, groupName]);

  const handleCreate = async (): Promise<void> => {
    if (!canCreate) return;
    setLoading(true);
    setError(null);
    try {
      if (type === "direct") {
        const target = selected[0];
        if (!target) return;
        const { conversation } = await createDirect.mutateAsync(target.id);
        setActiveConversationId(conversation.id);
      } else {
        const { conversation } = await createGroup.mutateAsync({
          name: groupName.trim(),
          participantIds: selected.map((s) => s.id),
        });
        setActiveConversationId(conversation.id);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            New conversation
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-4 mb-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={type === "direct"}
              onChange={() => {
                setType("direct");
                setSelected((s) => s.slice(0, 1));
              }}
            />
            Direct
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={type === "group"}
              onChange={() => setType("group")}
            />
            Group
          </label>
        </div>

        {type === "group" && (
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md"
          />
        )}

        <input
          type="text"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="Search users…"
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md"
        />

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selected.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
              >
                {u.firstName} {u.lastName}
                <button onClick={() => toggle(u)}>×</button>
              </span>
            ))}
          </div>
        )}

        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md mb-3">
          {results.map((u) => {
            const isSelected = selected.some((s) => s.id === u.id);
            return (
              <button
                key={u.id}
                onClick={() => toggle(u)}
                className={`block w-full text-left px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 ${
                  isSelected ? "bg-primary-50" : ""
                }`}
              >
                <p className="text-sm font-medium text-gray-900">
                  {u.firstName} {u.lastName}
                </p>
                <p className="text-xs text-gray-500">@{u.username}</p>
              </button>
            );
          })}
          {queryText.trim() && results.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-gray-500">
              No users found
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleCreate()}
            disabled={!canCreate || loading}
            className="px-4 py-2 text-sm rounded-md text-white bg-primary-600 disabled:bg-gray-300"
          >
            {loading ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
