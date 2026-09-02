import { Op } from "sequelize";
import { Conversation, ConversationParticipant, User } from "../models";
import { BadRequestError, NotFoundError, ForbiddenError } from "../lib/errors";
import { toWire } from "../lib/serialize";
import { emitToUsers } from "../websocket/io";
import type {
  Conversation as ConversationDto,
  Message as MessageDto,
  PaginationParams,
} from "../types";

/** User ids of everyone currently active in a conversation. */
export async function activeParticipantIds(
  conversationId: string,
): Promise<number[]> {
  const rows = await ConversationParticipant.findAll({
    where: { conversationId, isActive: true },
    attributes: ["userId"],
  });
  return rows.map((row) => row.userId);
}

/** @throws ForbiddenError */
export async function assertParticipant(
  conversationId: string,
  userId: number,
): Promise<void> {
  const count = await ConversationParticipant.count({
    where: { conversationId, userId, isActive: true },
  });
  if (count === 0) {
    throw new ForbiddenError("Not a participant in this conversation");
  }
}

/** Reload a conversation with participants + creator and serialize it. */
async function toConversationDto(
  conversation: Conversation,
): Promise<ConversationDto> {
  const full = await Conversation.getConversationById(conversation.id);
  return toWire<ConversationDto>(full ?? conversation);
}

/** The caller's conversations, each with `lastMessage` and `unreadCount`. */
export async function listConversations(
  userId: number,
  pagination: PaginationParams = {},
): Promise<ConversationDto[]> {
  const conversations = await Conversation.getUserConversations(
    userId,
    pagination,
  );
  return Promise.all(
    conversations.map(async (conversation) => {
      const [lastMessage, unreadCount] = await Promise.all([
        conversation.getLastMessage(),
        conversation.getUnreadCount(userId),
      ]);
      return {
        ...toWire<ConversationDto>(conversation),
        lastMessage: lastMessage ? toWire<MessageDto>(lastMessage) : null,
        unreadCount,
      };
    }),
  );
}

/** @throws NotFoundError, ForbiddenError */
export async function getConversation(
  conversationId: string,
  userId: number,
): Promise<Conversation> {
  const conversation = await Conversation.getConversationById(
    conversationId,
    userId,
  );
  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }
  return conversation;
}

/** @throws BadRequestError, NotFoundError */
export async function startDirectConversation(
  userId: number,
  recipientId: number,
): Promise<{ conversation: ConversationDto; created: boolean }> {
  if (recipientId === userId) {
    throw new BadRequestError("Cannot create a conversation with yourself");
  }
  const recipient = await User.findByPk(recipientId, { attributes: ["id"] });
  if (!recipient) {
    throw new NotFoundError("Recipient not found");
  }

  const { conversation, created } =
    await Conversation.findOrCreateDirectConversation(userId, recipientId);
  const dto = await toConversationDto(conversation);

  if (created) {
    emitToUsers([userId, recipientId], "conversation:created", dto);
  }
  return { conversation: dto, created };
}

/** @throws BadRequestError, NotFoundError */
export async function startGroupConversation(
  creatorId: number,
  name: string,
  participantIds: readonly number[],
): Promise<ConversationDto> {
  const others = [...new Set(participantIds)].filter((id) => id !== creatorId);
  if (others.length === 0) {
    throw new BadRequestError("A group needs at least one other participant");
  }

  const found = await User.count({ where: { id: { [Op.in]: others } } });
  if (found !== others.length) {
    throw new NotFoundError("One or more participants were not found");
  }

  const conversation = await Conversation.createGroupConversation(
    name,
    creatorId,
    others,
  );
  const dto = await toConversationDto(conversation);

  emitToUsers([creatorId, ...others], "conversation:created", dto);
  return dto;
}
