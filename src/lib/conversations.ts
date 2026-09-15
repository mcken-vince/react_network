import type { Conversation, ConversationParticipant } from "../types";

export function otherParticipants(
  conversation: Conversation,
  currentUserId: number | undefined,
): ConversationParticipant[] {
  return (conversation.participants ?? []).filter(
    (p) => p.userId !== currentUserId,
  );
}

export function conversationTitle(
  conversation: Conversation,
  currentUserId: number | undefined,
): string {
  if (conversation.type === "group") {
    return conversation.name || "Group chat";
  }
  const other = otherParticipants(conversation, currentUserId)[0]?.user;
  return other ? `${other.firstName} ${other.lastName}` : "Direct message";
}
