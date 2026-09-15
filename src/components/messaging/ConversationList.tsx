import { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  useActiveConversation,
  useConversations,
} from "../../hooks/useMessaging";
import { useWebSocket } from "../../hooks/useWebSocket";
import { conversationTitle, otherParticipants } from "../../lib/conversations";
import { CreateConversationModal } from "./CreateConversationModal";
import type { Conversation } from "../../types";

function formatTime(timestamp: string | null | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const hours = (Date.now() - date.getTime()) / 3_600_000;
  if (hours < 24)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (hours < 168) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function preview(conversation: Conversation): string {
  const message = conversation.lastMessage;
  if (!message) return "No messages yet";
  const body =
    message.content.length > 50
      ? `${message.content.slice(0, 50)}…`
      : message.content;
  if (message.messageType === "system") return body;
  return `${message.sender?.firstName ?? "Someone"}: ${body}`;
}

export function ConversationList() {
  const { user } = useAuth();
  const { data: conversations = [] } = useConversations();
  const { activeConversationId, setActiveConversationId } =
    useActiveConversation();
  const { onlineUserIds } = useWebSocket();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      conversationTitle(c, user?.id).toLowerCase().includes(q),
    );
  }, [conversations, searchQuery, user?.id]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            New
          </button>
        </div>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          filtered.map((conversation) => {
            const others = otherParticipants(conversation, user?.id);
            const online =
              conversation.type === "direct" &&
              others.some((p) => onlineUserIds.has(p.userId));

            return (
              <button
                type="button"
                key={conversation.id}
                onClick={() => setActiveConversationId(conversation.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                  activeConversationId === conversation.id
                    ? "bg-primary-50"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {conversationTitle(conversation, user?.id)}
                    {online && (
                      <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full align-middle" />
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    {(conversation.unreadCount ?? 0) > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-primary-600 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessage?.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 truncate mt-1">
                  {preview(conversation)}
                </p>
              </button>
            );
          })
        )}
      </div>

      {isCreateOpen && (
        <CreateConversationModal onClose={() => setIsCreateOpen(false)} />
      )}
    </div>
  );
}
