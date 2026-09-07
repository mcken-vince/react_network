import { createContext, useMemo, useState, type ReactNode } from "react";

interface MessagingContextValue {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

export const MessagingContext = createContext<MessagingContextValue | null>(
  null,
);

export function MessagingProvider({ children }: { children: ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const value = useMemo(
    () => ({ activeConversationId, setActiveConversationId }),
    [activeConversationId],
  );

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}
