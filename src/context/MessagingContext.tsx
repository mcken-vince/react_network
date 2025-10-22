import React, {
  useReducer,
  useEffect,
  ReactNode,
  createContext,
  useCallback,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { messageAPI } from "../utils/api";

// Types
interface Message {
  id: string;
  conversationId: string;
  senderId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited?: boolean;
  replyToId?: string;
  sender?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
  };
}

interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
  participants?: Array<{
    id: string;
    userId: number;
    user?: {
      id: number;
      firstName: string;
      lastName: string;
      username: string;
    };
  }>;
}

interface MessagingState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  loading: boolean;
  error: string | null;
  unreadCount: number;
}

interface MessagingContextValue extends MessagingState {
  loadConversations: () => Promise<void>;
  createDirectConversation: (participantId: number) => Promise<Conversation>;
  createGroupConversation: (
    name: string,
    participantIds: number[]
  ) => Promise<Conversation>;
  loadMessages: (conversationId: string) => Promise<Message[]>;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string | null
  ) => Promise<Message>;
  editMessage: (
    conversationId: string,
    messageId: string,
    content: string
  ) => Promise<Message>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  clearError: () => void;
  getActiveConversation: () => Conversation | undefined;
  getConversationMessages: (conversationId: string) => Message[];
}

// Action types
const MESSAGING_ACTIONS = {
  SET_CONVERSATIONS: "SET_CONVERSATIONS",
  ADD_CONVERSATION: "ADD_CONVERSATION",
  UPDATE_CONVERSATION: "UPDATE_CONVERSATION",
  SET_ACTIVE_CONVERSATION: "SET_ACTIVE_CONVERSATION",
  SET_MESSAGES: "SET_MESSAGES",
  ADD_MESSAGE: "ADD_MESSAGE",
  UPDATE_MESSAGE: "UPDATE_MESSAGE",
  DELETE_MESSAGE: "DELETE_MESSAGE",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  MARK_AS_READ: "MARK_AS_READ",
} as const;

type MessagingAction =
  | { type: "SET_CONVERSATIONS"; payload: Conversation[] }
  | { type: "ADD_CONVERSATION"; payload: Conversation }
  | {
      type: "UPDATE_CONVERSATION";
      payload: Partial<Conversation> & { id: string };
    }
  | { type: "SET_ACTIVE_CONVERSATION"; payload: string | null }
  | { type: "SET_MESSAGES"; conversationId: string; payload: Message[] }
  | {
      type: "ADD_MESSAGE";
      payload: { conversationId: string; message: Message };
    }
  | {
      type: "UPDATE_MESSAGE";
      conversationId: string;
      payload: Partial<Message> & { id: string };
    }
  | { type: "DELETE_MESSAGE"; conversationId: string; messageId: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "MARK_AS_READ"; conversationId: string };

// Initial state
const initialState: MessagingState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  loading: false,
  error: null,
  unreadCount: 0,
};

// Reducer
function messagingReducer(
  state: MessagingState,
  action: MessagingAction
): MessagingState {
  switch (action.type) {
    case "SET_CONVERSATIONS":
      return {
        ...state,
        conversations: action.payload,
        unreadCount: action.payload.reduce(
          (count, conv) => count + (conv.unreadCount || 0),
          0
        ),
      };

    case "ADD_CONVERSATION":
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    case "UPDATE_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.id ? { ...conv, ...action.payload } : conv
        ),
      };

    case "SET_ACTIVE_CONVERSATION":
      return {
        ...state,
        activeConversationId: action.payload,
      };

    case "SET_MESSAGES":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: action.payload,
        },
      };

    case "ADD_MESSAGE": {
      const { conversationId, message } = action.payload;
      const existingMessages = state.messages[conversationId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, message],
        },
        // Update conversation's last message
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                lastMessage: message,
                updatedAt: message.createdAt,
              }
            : conv
        ),
      };
    }

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]:
            state.messages[action.conversationId]?.map((msg) =>
              msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
            ) || [],
        },
      };

    case "DELETE_MESSAGE":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]:
            state.messages[action.conversationId]?.filter(
              (msg) => msg.id !== action.messageId
            ) || [],
        },
      };

    case "MARK_AS_READ":
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.conversationId ? { ...conv, unreadCount: 0 } : conv
        ),
      };

    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    default:
      return state;
  }
}

export const MessagingContext = createContext<MessagingContextValue | null>(
  null
);

interface MessagingProviderProps {
  children: ReactNode;
}

export function MessagingProvider({ children }: MessagingProviderProps) {
  const [state, dispatch] = useReducer(messagingReducer, initialState);
  const { user } = useAuth();

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // API methods
  const loadConversations = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const conversations = await messageAPI.getConversations();
      dispatch({
        type: "SET_CONVERSATIONS",
        payload: conversations,
      });
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const createDirectConversation = useCallback(
    async (participantId: number): Promise<Conversation> => {
      try {
        const conversation = await messageAPI.createDirectConversation(
          participantId.toString()
        );
        dispatch({
          type: "ADD_CONVERSATION",
          payload: conversation,
        });
        return conversation;
      } catch (error: any) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },
    []
  );

  const createGroupConversation = useCallback(
    async (name: string, participantIds: number[]): Promise<Conversation> => {
      try {
        const conversation = await messageAPI.createGroupConversation(
          name,
          participantIds
        );
        dispatch({
          type: "ADD_CONVERSATION",
          payload: conversation,
        });
        return conversation;
      } catch (error: any) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },
    []
  );

  const loadMessages = useCallback(
    async (conversationId: string): Promise<Message[]> => {
      try {
        const messages = await messageAPI.getMessages(conversationId);
        dispatch({
          type: "SET_MESSAGES",
          conversationId,
          payload: messages,
        });
        return messages;
      } catch (error: any) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      replyToId: string | null = null
    ): Promise<Message> => {
      try {
        const message = await messageAPI.sendMessage(
          conversationId,
          content,
          replyToId
        );
        dispatch({
          type: "ADD_MESSAGE",
          payload: { conversationId, message },
        });
        return message;
      } catch (error: any) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },
    []
  );

  const editMessage = useCallback(
    async (
      conversationId: string,
      messageId: string,
      content: string
    ): Promise<Message> => {
      try {
        const updatedMessage = await messageAPI.editMessage(messageId, content);
        dispatch({
          type: "UPDATE_MESSAGE",
          conversationId,
          payload: updatedMessage,
        });
        return updatedMessage;
      } catch (error: any) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },
    []
  );

  const deleteMessage = useCallback(
    async (conversationId: string, messageId: string): Promise<void> => {
      try {
        await messageAPI.deleteMessage(messageId);
        dispatch({
          type: "DELETE_MESSAGE",
          conversationId,
          messageId,
        });
      } catch (error: any) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }
    },
    []
  );

  const setActiveConversation = useCallback(
    (conversationId: string | null): void => {
      dispatch({
        type: "SET_ACTIVE_CONVERSATION",
        payload: conversationId,
      });

      // Mark as read when conversation becomes active
      if (conversationId) {
        markAsRead(conversationId);
      }
    },
    []
  );

  const markAsRead = useCallback(
    async (conversationId: string): Promise<void> => {
      try {
        await messageAPI.markAsRead(conversationId);
        dispatch({ type: "MARK_AS_READ", conversationId });
      } catch (error) {
        console.error("Error marking conversation as read:", error);
      }
    },
    []
  );

  const clearError = useCallback((): void => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  const contextValue: MessagingContextValue = {
    // State
    ...state,

    // Actions
    loadConversations,
    createDirectConversation,
    createGroupConversation,
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    setActiveConversation,
    markAsRead,
    clearError,

    // Helper getters
    getActiveConversation: () =>
      state.conversations.find(
        (conv) => conv.id === state.activeConversationId
      ),
    getConversationMessages: (conversationId: string) =>
      state.messages[conversationId] || [],
  };

  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
    </MessagingContext.Provider>
  );
}
