import { Op } from "sequelize";
import { Conversation, ConversationParticipant, User } from "../models";
import { BadRequestError, NotFoundError, ForbiddenError } from "../lib/errors";
import { toWire } from "../lib/serialize";
import { emitToUser, emitToUsers } from "../websocket/io";
import type {
  Conversation as ConversationDto,
  MessagePreview,
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
        lastMessage: lastMessage ? toWire<MessagePreview>(lastMessage) : null,
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

// ---------------------------------------------------------------------------
// Group management
// ---------------------------------------------------------------------------

/** A group the caller belongs to. @throws NotFoundError, ForbiddenError, BadRequestError */
async function loadGroup(
  conversationId: string,
  userId: number,
): Promise<Conversation> {
  const conversation = await getConversation(conversationId, userId);
  if (conversation.type !== "group") {
    throw new BadRequestError("Only group conversations can be managed");
  }
  return conversation;
}

function assertAdmin(conversation: Conversation, userId: number): void {
  const me = conversation.participants?.find((p) => p.userId === userId);
  if (!me?.isAdmin) throw new ForbiddenError("Only group admins can do that");
}

/** Reload, serialize, and push `conversation:updated` to every active participant. */
async function broadcastUpdated(
  conversationId: string,
): Promise<ConversationDto> {
  const full = await Conversation.getConversationById(conversationId);
  if (!full) throw new NotFoundError("Conversation not found");
  const dto = toWire<ConversationDto>(full);
  emitToUsers(
    await activeParticipantIds(conversationId),
    "conversation:updated",
    dto,
  );
  return dto;
}

export async function renameGroup(
  conversationId: string,
  userId: number,
  name: string,
): Promise<ConversationDto> {
  const conversation = await loadGroup(conversationId, userId);
  assertAdmin(conversation, userId);
  await conversation.update({ name });
  return broadcastUpdated(conversationId);
}

/** Re-activates users who previously left; creates the rest. */
export async function addParticipants(
  conversationId: string,
  userId: number,
  userIds: readonly number[],
): Promise<ConversationDto> {
  const conversation = await loadGroup(conversationId, userId);
  assertAdmin(conversation, userId);

  const active = new Set(
    (conversation.participants ?? []).map((p) => p.userId),
  );
  const toAdd = [...new Set(userIds)].filter((id) => !active.has(id));
  if (toAdd.length === 0) {
    throw new BadRequestError("Everyone listed is already in the group");
  }
  const found = await User.count({ where: { id: { [Op.in]: toAdd } } });
  if (found !== toAdd.length) {
    throw new NotFoundError("One or more users were not found");
  }

  await Promise.all(
    toAdd.map(async (id) => {
      const existing = await ConversationParticipant.findOne({
        where: { conversationId, userId: id },
      });
      if (existing) {
        await existing.update({
          isActive: true,
          isAdmin: false,
          joinedAt: new Date(),
        });
      } else {
        await ConversationParticipant.create({ conversationId, userId: id });
      }
    }),
  );
  return broadcastUpdated(conversationId);
}

/**
 * Admins may remove anyone; anyone may remove themselves (leave). If the last
 * admin leaves, the longest-standing remaining member is promoted.
 */
export async function removeParticipant(
  conversationId: string,
  actorId: number,
  targetId: number,
): Promise<void> {
  const conversation = await loadGroup(conversationId, actorId);
  if (targetId !== actorId) assertAdmin(conversation, actorId);

  const participants = conversation.participants ?? [];
  const target = participants.find((p) => p.userId === targetId);
  if (!target) {
    throw new NotFoundError("That user is not in this conversation");
  }
  await target.update({ isActive: false });

  const remaining = participants.filter((p) => p.userId !== targetId);
  if (
    target.isAdmin &&
    remaining.length > 0 &&
    !remaining.some((p) => p.isAdmin)
  ) {
    const successor = [...remaining].sort(
      (a, b) => (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0),
    )[0];
    if (successor) await successor.update({ isAdmin: true });
  }

  emitToUser(targetId, "conversation:removed", conversationId);
  if (remaining.length > 0) await broadcastUpdated(conversationId);
}
