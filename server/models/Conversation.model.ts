import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Table,
} from "sequelize-typescript";
import { Op, literal } from "sequelize";
import type { IncludeOptions, Transaction, WhereOptions } from "sequelize";
import { BaseUuidModel } from "./BaseUuidModel";
import User from "./User.model";
import ConversationParticipant from "./ConversationParticipant.model";
import Message from "./Message.model";
import { includeUser } from "./includes";
import { ForbiddenError } from "../lib/errors";
import { LIMITS } from "../../shared/limits";
import type { ConversationType } from "../../shared/types";
import type {
  ConversationAttributes,
  ConversationCreationAttributes,
  MessageAttributes,
} from "./types";

const TYPES: readonly ConversationType[] = ["direct", "group"];

const includeParticipants = (): IncludeOptions => ({
  model: ConversationParticipant,
  as: "participants",
  where: { isActive: true },
  required: false,
  include: [includeUser("user")],
});

@Table({
  tableName: "conversations",
  timestamps: true,
  indexes: [
    { fields: ["type"], name: "idx_conversations_type" },
    { fields: ["createdBy"], name: "idx_conversations_creator" },
    { fields: ["lastMessageAt"], name: "idx_conversations_last_message" },
    { fields: ["createdAt"], name: "idx_conversations_created_at" },
  ],
})
export default class Conversation extends BaseUuidModel<
  ConversationAttributes,
  ConversationCreationAttributes
> {
  @AllowNull(false)
  @Default("direct")
  @Column({
    type: DataType.ENUM(...TYPES),
    validate: {
      isIn: { args: [TYPES], msg: "Type must be either 'direct' or 'group'" },
    },
  })
  type!: ConversationType;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(LIMITS.CONVERSATION_NAME_MAX),
    validate: {
      len: {
        args: [0, LIMITS.CONVERSATION_NAME_MAX],
        msg: `Name must be less than ${LIMITS.CONVERSATION_NAME_MAX} characters`,
      },
    },
  })
  name!: string | null;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, onDelete: "CASCADE" })
  createdBy!: number;

  @AllowNull(true)
  @Column(DataType.DATE)
  lastMessageAt!: Date | null;

  @BelongsTo(() => User, { foreignKey: "createdBy", as: "creator" })
  creator?: User;

  @HasMany(() => ConversationParticipant, {
    foreignKey: "conversationId",
    as: "participants",
  })
  participants?: ConversationParticipant[];

  @HasMany(() => Message, { foreignKey: "conversationId", as: "messages" })
  messages?: Message[];

  // --------------------------------------------------------------------------
  // Instance helpers
  // --------------------------------------------------------------------------

  async hasParticipant(userId: number): Promise<boolean> {
    const count = await ConversationParticipant.count({
      where: { conversationId: this.id, userId, isActive: true },
    });
    return count > 0;
  }

  getLastMessage(): Promise<Message | null> {
    return Message.findOne({
      where: { conversationId: this.id },
      order: [["createdAt", "DESC"]],
      include: [includeUser("sender")],
    });
  }

  /** Messages from others created after the user's `lastReadAt`. */
  async getUnreadCount(userId: number): Promise<number> {
    const participant = await ConversationParticipant.findOne({
      where: { conversationId: this.id, userId, isActive: true },
      attributes: ["lastReadAt"],
    });
    if (!participant) return 0;

    const where: WhereOptions<MessageAttributes> = {
      conversationId: this.id,
      senderId: { [Op.ne]: userId },
      ...(participant.lastReadAt && {
        createdAt: { [Op.gt]: participant.lastReadAt },
      }),
    };
    return Message.count({ where });
  }

  // --------------------------------------------------------------------------
  // Lookups
  // --------------------------------------------------------------------------

  /**
   * Load a conversation with participants + creator. When `userId` is given,
   * @throws ForbiddenError if that user is not an active participant.
   */
  static async getConversationById(
    conversationId: string,
    userId?: number,
  ): Promise<Conversation | null> {
    const conversation = await this.findByPk(conversationId, {
      include: [includeParticipants(), includeUser("creator")],
    });
    if (!conversation) return null;

    if (userId !== undefined && !(await conversation.hasParticipant(userId))) {
      throw new ForbiddenError("Not a participant in this conversation");
    }
    return conversation;
  }

  /** Conversations the user is an active participant of, most recent first. */
  static async getUserConversations(
    userId: number,
    options: { limit?: number; offset?: number } = {},
  ): Promise<Conversation[]> {
    const { limit = LIMITS.PAGE_LIMIT_DEFAULT, offset = 0 } = options;

    const memberships = await ConversationParticipant.findAll({
      where: { userId, isActive: true },
      attributes: ["conversationId"],
    });
    if (memberships.length === 0) return [];

    return this.findAll({
      where: { id: { [Op.in]: memberships.map((m) => m.conversationId) } },
      include: [includeParticipants()],
      order: [
        literal('"lastMessageAt" DESC NULLS LAST'),
        ["createdAt", "DESC"],
      ],
      limit,
      offset,
    });
  }

  /** The direct conversation between exactly these two users, if any. */
  static async findDirectConversation(
    userId1: number,
    userId2: number,
  ): Promise<Conversation | null> {
    const mine = await ConversationParticipant.findAll({
      where: { userId: userId1, isActive: true },
      attributes: ["conversationId"],
    });
    if (mine.length === 0) return null;

    const candidates = await this.findAll({
      where: {
        id: { [Op.in]: mine.map((m) => m.conversationId) },
        type: "direct",
      },
      include: [
        {
          model: ConversationParticipant,
          as: "participants",
          where: { isActive: true },
          required: true,
        },
      ],
    });

    return (
      candidates.find((c) => {
        const ids = (c.participants ?? []).map((p) => p.userId);
        return ids.length === 2 && ids.includes(userId2);
      }) ?? null
    );
  }

  // --------------------------------------------------------------------------
  // Creation
  // --------------------------------------------------------------------------

  static async findOrCreateDirectConversation(
    userId1: number,
    userId2: number,
    transaction?: Transaction,
  ): Promise<{ conversation: Conversation; created: boolean }> {
    const existing = await this.findDirectConversation(userId1, userId2);
    if (existing) return { conversation: existing, created: false };

    const conversation = await this.create(
      { type: "direct", createdBy: userId1 },
      { transaction },
    );
    await ConversationParticipant.bulkCreate(
      [userId1, userId2].map((userId) => ({
        conversationId: conversation.id,
        userId,
      })),
      { transaction },
    );
    return { conversation, created: true };
  }

  static async createGroupConversation(
    name: string,
    creatorId: number,
    participantIds: number[],
    transaction?: Transaction,
  ): Promise<Conversation> {
    const conversation = await this.create(
      { type: "group", name, createdBy: creatorId },
      { transaction },
    );
    const uniqueIds = [...new Set([creatorId, ...participantIds])];
    await ConversationParticipant.bulkCreate(
      uniqueIds.map((userId) => ({
        conversationId: conversation.id,
        userId,
        isAdmin: userId === creatorId,
      })),
      { transaction },
    );
    return conversation;
  }
}
