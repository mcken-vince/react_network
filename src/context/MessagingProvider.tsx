import { useMemo, useState, type ReactNode } from "react";
import { MessagingContext } from "./MessagingContext";

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
