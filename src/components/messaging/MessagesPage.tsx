import {
  useActiveConversation,
  useConversations,
} from "../../hooks/useMessaging";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";

export function MessagesPage() {
  const { activeConversationId } = useActiveConversation();
  const { isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-1/3 min-w-80 border-r border-gray-200 bg-white">
        <ConversationList />
      </div>
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <ChatWindow conversationId={activeConversationId} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No conversation selected
              </h3>
              <p className="text-gray-500">
                Choose a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
