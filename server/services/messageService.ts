import { ConversationParticipant, Message } from "../models";
import { NotFoundError } from "../lib/errors";
import { toWire } from "../lib/serialize";
import { emitToUsers } from "../websocket/io";
import { activeParticipantIds, assertParticipant } from "./conversationService";
import { LIMITS } from "../../shared/limits";
import type {
  Message as MessageDto,
  MessagesQuery,
  SendMessageData,
} from "../types";
import {
  markConversationNotificationsRead,
  notifyMessageReply,
  notifyNewMessage,
} from "./notificationService";

/** Newest-first page; `nextCursor` is the id to pass as `beforeMessageId` for the next (older) page. */
export async function listMessages(
  conversationId: string,
  userId: number,
  query: MessagesQuery = {},
): Promise<{ messages: MessageDto[]; nextCursor?: string }> {
  await assertParticipant(conversationId, userId);

  const limit = Math.min(
    query.limit ?? LIMITS.PAGE_LIMIT_DEFAULT,
    LIMITS.PAGE_LIMIT_MAX,
  );
  const rows = await Message.getConversationMessages(conversationId, {
    limit,
    beforeMessageId: query.beforeMessageId ?? null,
  });

  const oldest = rows.at(-1);
  return {
    messages: rows.map((row) => toWire<MessageDto>(row)),
    nextCursor: rows.length === limit && oldest ? oldest.id : undefined,
  };
}

/** @throws ForbiddenError, NotFoundError */
export async function sendMessage(
  conversationId: string,
  senderId: number,
  data: SendMessageData,
): Promise<MessageDto> {
  await assertParticipant(conversationId, senderId);

  let parent: Message | null = null;
  if (data.replyToId) {
    parent = await Message.findOne({
      where: { id: data.replyToId, conversationId },
      attributes: ["id", "senderId"],
    });
    if (!parent) {
      throw new NotFoundError("The message being replied to was not found");
    }
  }

  const created = await Message.create({
    conversationId,
    senderId,
    content: data.content,
    replyToId: parent?.id ?? null,
    readBy: [senderId],
  });
  const full = (await Message.getMessageById(created.id)) ?? created;
  const dto = toWire<MessageDto>(full);

  const participantIds = await activeParticipantIds(conversationId);
  emitToUsers(participantIds, "message:new", dto);

  // The replied-to author gets a specific "replied to you"; everyone else
  // (and the replied-to author if they're the sender) gets the generic one.
  const replyTarget =
    parent && parent.senderId !== senderId ? parent.senderId : null;
  await Promise.all(
    participantIds
      .filter((id) => id !== senderId)
      .map((id) =>
        id === replyTarget && parent
          ? notifyMessageReply(
              id,
              senderId,
              created.id,
              conversationId,
              parent.id,
              data.content,
            )
          : notifyNewMessage(
              id,
              senderId,
              created.id,
              conversationId,
              data.content,
            ),
      ),
  );
  return dto;
}

/** @throws NotFoundError, ForbiddenError */
export async function editMessage(
  messageId: string,
  userId: number,
  content: string,
): Promise<MessageDto> {
  const message = await Message.editMessage(messageId, userId, content);
  const dto = toWire<MessageDto>(message);

  emitToUsers(
    await activeParticipantIds(message.conversationId),
    "message:updated",
    dto,
  );
  return dto;
}

/** @throws NotFoundError, ForbiddenError */
export async function deleteMessage(
  messageId: string,
  userId: number,
): Promise<void> {
  const message = await Message.deleteMessage(messageId, userId);

  emitToUsers(
    await activeParticipantIds(message.conversationId),
    "message:deleted",
    {
      conversationId: message.conversationId,
      messageId,
    },
  );
}

/**
 * Mark a conversation read for `userId` (drives unreadCount), clear its
 * message notifications, and optionally record read receipts for specific
 * messages.
 * @throws ForbiddenError
 */
export async function markConversationRead(
  conversationId: string,
  userId: number,
  messageIds: readonly string[] = [],
): Promise<void> {
  await ConversationParticipant.markAsRead(conversationId, userId);
  if (messageIds.length > 0) {
    await Message.markAsRead([...messageIds], userId);
  }
  await markConversationNotificationsRead(userId, conversationId);
}
