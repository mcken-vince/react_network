import { io, Socket } from "socket.io-client";
import type { Notification, Message, Conversation, User } from "../types";

// Define WebSocket event types
export interface ServerToClientEvents {
  // Notification events
  "notification:new": (notification: Notification) => void;
  "notification:updated": (notification: Notification) => void;

  // Message events
  "message:new": (message: Message) => void;
  "message:updated": (message: Message) => void;
  "message:deleted": (messageId: string) => void;
  "message:typing": (data: {
    conversationId: string;
    userId: number;
    isTyping: boolean;
  }) => void;

  // Conversation events
  "conversation:created": (conversation: Conversation) => void;

  // User presence
  "user:status": (data: {
    userId: number;
    status: "online" | "offline" | "away";
  }) => void;

  // System events
  error: (error: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  // Authentication
  "auth:login": (
    token: string,
    callback: (response: { success: boolean; user?: User }) => void
  ) => void;

  // Notifications
  "notification:markRead": (notificationId: string) => void;
  "notification:markAllRead": () => void;

  // Messages
  "message:send": (data: { conversationId: string; content: string }) => void;
  "message:edit": (data: { messageId: string; content: string }) => void;
  "message:delete": (messageId: string) => void;
  "message:markRead": (data: {
    conversationId: string;
    messageIds: string[];
  }) => void;
  "message:typing": (data: {
    conversationId: string;
    isTyping: boolean;
  }) => void;

  // Conversation
  "conversation:join": (conversationId: string) => void;
  "conversation:leave": (conversationId: string) => void;
  "conversation:create": (data: {
    userIds: number[];
    type: "direct" | "group";
    name?: string;
  }) => void;

  // Presence
  "presence:update": (status: "online" | "away" | "offline") => void;

  // Subscription
  "subscribe:notifications": () => void;
  "unsubscribe:notifications": () => void;
}

// Socket instance
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

// Initialize socket connection
export const initSocket = (
  token: string
): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (socket) {
    return socket;
  }

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

  socket = io(serverUrl, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Handle connection events
  socket.on("connect", () => {
    console.log("WebSocket connected:", socket?.id);

    // Authenticate with token
    socket?.emit("auth:login", token, (response) => {
      if (response.success) {
        console.log("WebSocket authenticated:", response.user);

        // Subscribe to notifications
        socket?.emit("subscribe:notifications");
      } else {
        console.error("WebSocket authentication failed");
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("WebSocket disconnected");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  return socket;
};

// Get socket instance
export const getSocket = (): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> | null => {
  return socket;
};

// Disconnect socket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Check if socket is connected
export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};
