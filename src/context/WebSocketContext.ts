import { createContext } from "react";

export interface WebSocketContextValue {
  isConnected: boolean;
  onlineUserIds: ReadonlySet<number>;
  isUserOnline: (userId: number) => boolean;
  /** conversationId → userIds currently typing (excludes the current user). */
  typingByConversation: Record<string, number[]>;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
}

export const WebSocketContext = createContext<
  WebSocketContextValue | undefined
>(undefined);
