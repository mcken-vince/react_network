import React, { useReducer, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import * as messageAPI from "../lib/api/messages";
import { MessagingContext } from "./messagingContext";

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
};

// Initial state
const initialState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  loading: false,
  error: null,
  unreadCount: 0,
};

// Reducer
function messagingReducer(state, action) {
  switch (action.type) {
    case MESSAGING_ACTIONS.SET_CONVERSATIONS:
      return {
        ...state,
        conversations: action.payload,
        unreadCount: action.payload.reduce(
          (count, conv) => count + (conv.unreadCount || 0),
          0
        ),
      };

    case MESSAGING_ACTIONS.ADD_CONVERSATION:
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    case MESSAGING_ACTIONS.UPDATE_CONVERSATION:
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.id ? { ...conv, ...action.payload } : conv
        ),
      };

    case MESSAGING_ACTIONS.SET_ACTIVE_CONVERSATION:
      return {
        ...state,
        activeConversationId: action.payload,
      };

    case MESSAGING_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: action.payload,
        },
      };

    case MESSAGING_ACTIONS.ADD_MESSAGE: {
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

    case MESSAGING_ACTIONS.UPDATE_MESSAGE:
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

    case MESSAGING_ACTIONS.DELETE_MESSAGE:
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

    case MESSAGING_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.conversationId ? { ...conv, unreadCount: 0 } : conv
        ),
      };

    case MESSAGING_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case MESSAGING_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    default:
      return state;
  }
}

export function MessagingProvider({ children }) {
  const [state, dispatch] = useReducer(messagingReducer, initialState);
  const { user } = useAuth();

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // API methods
  const loadConversations = async () => {
    try {
      dispatch({ type: MESSAGING_ACTIONS.SET_LOADING, payload: true });
      const conversations = await messageAPI.getConversations();
      dispatch({
        type: MESSAGING_ACTIONS.SET_CONVERSATIONS,
        payload: conversations,
      });
    } catch (error) {
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: MESSAGING_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const createDirectConversation = async (participantId) => {
    try {
      const conversation =
        await messageAPI.createDirectConversation(participantId);
      dispatch({
        type: MESSAGING_ACTIONS.ADD_CONVERSATION,
        payload: conversation,
      });
      return conversation;
    } catch (error) {
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const createGroupConversation = async (name, participantIds) => {
    try {
      const conversation = await messageAPI.createGroupConversation(
        name,
        participantIds
      );
      dispatch({
        type: MESSAGING_ACTIONS.ADD_CONVERSATION,
        payload: conversation,
      });
      return conversation;
    } catch (error) {
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const messages = await messageAPI.getMessages(conversationId);
      dispatch({
        type: MESSAGING_ACTIONS.SET_MESSAGES,
        conversationId,
        payload: messages,
      });
      return messages;
    } catch (error) {
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const sendMessage = async (conversationId, content, replyToId = null) => {
    try {
      const message = await messageAPI.sendMessage(
        conversationId,
        content,
        replyToId
      );
      dispatch({
        type: MESSAGING_ACTIONS.ADD_MESSAGE,
        payload: { conversationId, message },
      });
      return message;
    } catch (error) {
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const editMessage = async (conversationId, messageId, content) => {
    try {
      const updatedMessage = await messageAPI.editMessage(messageId, content);
      dispatch({
        type: MESSAGING_ACTIONS.UPDATE_MESSAGE,
        conversationId,
        payload: updatedMessage,
      });
      return updatedMessage;
    } catch (error) {
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const deleteMessage = async (conversationId, messageId) => {
    try {
      await messageAPI.deleteMessage(messageId);
      dispatch({
        type: MESSAGING_ACTIONS.DELETE_MESSAGE,
        conversationId,
        messageId,
      });
    } catch (error) {
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const setActiveConversation = (conversationId) => {
    dispatch({
      type: MESSAGING_ACTIONS.SET_ACTIVE_CONVERSATION,
      payload: conversationId,
    });

    // Mark as read when conversation becomes active
    if (conversationId) {
      markAsRead(conversationId);
    }
  };

  const markAsRead = async (conversationId) => {
    try {
      await messageAPI.markAsRead(conversationId);
      dispatch({ type: MESSAGING_ACTIONS.MARK_AS_READ, conversationId });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const clearError = () => {
    dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: null });
  };

  const contextValue = {
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
    getConversationMessages: (conversationId) =>
      state.messages[conversationId] || [],
  };

  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
    </MessagingContext.Provider>
  );
}
