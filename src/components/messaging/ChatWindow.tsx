import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { conversationTitle } from "../../lib/conversations";
import {
  flattenMessages,
  useActiveConversation,
  useConversation,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
} from "../../hooks/useMessaging";
import { useWebSocket } from "../../hooks/useWebSocket";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { GroupSettings } from "./GroupSettings";
import type { SendMessageData } from "../../types";

export function ChatWindow({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const { setActiveConversationId } = useActiveConversation();
  const { data: conversation, error } = useConversation(conversationId);
  const messagesQuery = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const markRead = useMarkConversationRead();
  const { typingByConversation } = useWebSocket();
  const [showSettings, setShowSettings] = useState(false);

  const messages = flattenMessages(messagesQuery.data);
  const typingUserIds = (typingByConversation[conversationId] ?? []).filter(
    (id) => id !== user?.id,
  );

  useEffect(() => {
    setShowSettings(false);
    markRead.mutate({ conversationId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Removed from / left the conversation, or it no longer exists.
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Conversation unavailable
          </h3>
          <p className="text-gray-500 mb-4">
            You&apos;re no longer a participant in this conversation.
          </p>
          <button
            type="button"
            onClick={() => setActiveConversationId(null)}
            className="px-4 py-2 text-sm rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to conversations
          </button>
        </div>
      </div>
    );
  }

  const title = conversation
    ? conversationTitle(conversation, user?.id)
    : "Loading…";
  const isGroup = conversation?.type === "group";

  const handleSend = async (
    content: string,
    replyToId?: string | null,
  ): Promise<void> => {
    const data: SendMessageData = { content, replyToId: replyToId ?? null };
    await sendMessage.mutateAsync(data);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isGroup
              ? `${conversation.participants?.length ?? 0} participants`
              : "Direct conversation"}
          </p>
        </div>
        {isGroup && (
          <button
            type="button"
            onClick={() => setShowSettings((open) => !open)}
            className="text-sm px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {showSettings ? "Hide settings" : "Manage group"}
          </button>
        )}
      </div>

      {isGroup && showSettings && conversation && (
        <GroupSettings
          conversation={conversation}
          onClose={() => setShowSettings(false)}
          onLeft={() => setActiveConversationId(null)}
        />
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {messagesQuery.isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={user?.id}
            hasMore={Boolean(messagesQuery.hasNextPage)}
            isLoadingMore={messagesQuery.isFetchingNextPage}
            onLoadMore={() => messagesQuery.fetchNextPage()}
            onReply={handleSend}
          />
        )}
        {typingUserIds.length > 0 && (
          <div className="px-6 py-1 text-xs text-gray-500">
            Someone is typing…
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-white">
        <MessageInput
          conversationId={conversationId}
          disabled={sendMessage.isPending}
          placeholder={`Message ${title}…`}
          onSendMessage={(content) => handleSend(content)}
        />
      </div>
    </div>
  );
}
