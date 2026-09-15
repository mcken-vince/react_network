import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { conversationTitle } from "../../lib/conversations";
import {
  flattenMessages,
  useConversation,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
} from "../../hooks/useMessaging";
import { useWebSocket } from "../../hooks/useWebSocket";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import type { SendMessageData } from "../../types";

export function ChatWindow({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const { data: conversation } = useConversation(conversationId);
  const messagesQuery = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const markRead = useMarkConversationRead();
  const { typingByConversation } = useWebSocket();

  const messages = flattenMessages(messagesQuery.data);
  const typingUserIds = (typingByConversation[conversationId] ?? []).filter(
    (id) => id !== user?.id,
  );

  useEffect(() => {
    markRead.mutate({ conversationId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const title = conversation
    ? conversationTitle(conversation, user?.id)
    : "Loading…";

  const handleSend = async (
    content: string,
    replyToId?: string | null,
  ): Promise<void> => {
    const data: SendMessageData = { content, replyToId: replyToId ?? null };
    await sendMessage.mutateAsync(data);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {conversation?.type === "group"
            ? `${conversation.participants?.length ?? 0} participants`
            : "Direct conversation"}
        </p>
      </div>

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
