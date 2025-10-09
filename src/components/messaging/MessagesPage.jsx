import React, { useEffect } from "react";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { useMessaging } from "../../hooks/useMessaging";

export function MessagesPage() {
  const { activeConversationId, loadConversations, loading } = useMessaging();

  useEffect(() => {
    loadConversations();
  }, []);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading conversations...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Conversation List */}
        <div className="w-1/3 min-w-80 border-r border-gray-200 bg-white">
          <ConversationList />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversationId ? (
            <ChatWindow conversationId={activeConversationId} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No conversation selected
                </h3>
                <p className="text-gray-500">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
