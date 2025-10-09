import React, { useEffect, useRef, useState } from "react";
import { useMessaging } from "../../hooks/useMessaging";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export function ChatWindow({ conversationId }) {
  const {
    getActiveConversation,
    getConversationMessages,
    loadMessages,
    sendMessage,
    loading,
  } = useMessaging();

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const conversation = getActiveConversation();
  const messages = getConversationMessages(conversationId);
  const messagesEndRef = useRef(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      setIsLoadingMessages(true);
      loadMessages(conversationId).finally(() => setIsLoadingMessages(false));
    }
  }, [conversationId, loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (content, replyToId = null) => {
    try {
      await sendMessage(conversationId, content, replyToId);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const getConversationTitle = () => {
    if (!conversation) return "Loading...";

    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }

    // For direct conversations, show the other participant's name
    const otherParticipant = conversation.participants?.find(
      (p) => p.id !== conversation.currentUserId
    );
    return otherParticipant
      ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
      : "Direct Chat";
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {getConversationTitle()}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {conversation.type === "group"
                ? `${conversation.participants?.length || 0} participants`
                : "Direct conversation"}
            </p>
          </div>

          {/* Chat Actions */}
          <div className="flex items-center space-x-2">
            {conversation.type === "group" && (
              <button
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Group settings"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
            )}

            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Conversation info"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading messages...</p>
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            conversationId={conversationId}
            onReply={handleSendMessage}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={loading}
          placeholder={`Message ${getConversationTitle()}...`}
        />
      </div>
    </div>
  );
}
