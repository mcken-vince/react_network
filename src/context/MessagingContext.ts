import { createContext } from "react";

export interface MessagingContextValue {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

export const MessagingContext = createContext<MessagingContextValue | null>(
  null,
);
