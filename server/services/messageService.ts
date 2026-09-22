import { ConversationParticipant, Message, Reaction } from "../models";
import { NotFoundError } from "../lib/errors";
import { toWire } from "../lib/serialize";
import { emitToUsers } from "../websocket/io";
import { activeParticipantIds, assertParticipant } from "./conversationService";
import { viewerNeutral } from "./reactionService";
import { LIMITS } from "../../shared/limits";
import { emptyReactionSummary } from "../../shared/reactions";
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

/** What Sequelize serializes; `reactions` is added by `decorateMessages`. */
type MessageBase = Omit<MessageDto, "reactions">;

/** Two queries regardless of page size. */
async function decorateMessages(
  rows: Message[],
  viewerId: number,
): Promise<MessageDto[]> {
  if (rows.length === 0) return [];
  const reactions = await Reaction.summarize(
    "message",
    rows.map((row) => row.id),
    viewerId,
  );
  return rows.map((row) => ({
    ...toWire<MessageBase>(row),
    reactions: reactions.get(row.id) ?? emptyReactionSummary(),
  }));
}

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
    messages: await decorateMessages(rows, userId),
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
  // Brand new: nothing has reacted, so this payload is viewer-neutral as-is.
  const dto: MessageDto = {
    ...toWire<MessageBase>(full),
    reactions: emptyReactionSummary(),
  };
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
  const [dto] = await decorateMessages([message], userId);
  if (!dto)
    throw new Error("decorateMessages returned nothing for one message");
  // Recipients each have their own `mine`; clients keep cached reactions on
  // message:updated (an edit can't change them), so send a neutral summary.
  emitToUsers(
    await activeParticipantIds(message.conversationId),
    "message:updated",
    { ...dto, reactions: viewerNeutral(dto.reactions) },
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
 * message + reaction notifications, and optionally record read receipts for
 * specific messages.
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
