import {
  AfterCreate,
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Table,
} from "sequelize-typescript";
import { Op, col, fn, literal } from "sequelize";
import type {
  CreateOptions,
  IncludeOptions,
  Transaction,
  WhereAttributeHash,
} from "sequelize";
import { BaseUuidModel } from "./BaseUuidModel";
import User from "./User.model";
import Conversation from "./Conversation.model";
import { includeUser } from "./includes";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { LIMITS } from "../../shared/limits";
import type { MessageType } from "../../shared/types";
import type { MessageAttributes, MessageCreationAttributes } from "./types";

const MESSAGE_TYPES: readonly MessageType[] = [
  "text",
  "image",
  "file",
  "system",
];

const includeReplyTo = (): IncludeOptions => ({
  model: Message,
  as: "replyTo",
  required: false,
  include: [includeUser("sender")],
});

@Table({
  tableName: "messages",
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ["conversationId"], name: "idx_messages_conversation" },
    { fields: ["senderId"], name: "idx_messages_sender" },
    { fields: ["createdAt"], name: "idx_messages_created_at" },
    {
      fields: ["conversationId", "createdAt"],
      name: "idx_messages_conversation_timeline",
    },
    {
      fields: ["replyToId"],
      name: "idx_messages_reply_to",
      where: { replyToId: { [Op.ne]: null } },
    },
  ],
})
export default class Message extends BaseUuidModel<
  MessageAttributes,
  MessageCreationAttributes
> {
  @AllowNull(false)
  @ForeignKey(() => Conversation)
  @Column({ type: DataType.UUID, onDelete: "CASCADE" })
  conversationId!: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, onDelete: "CASCADE" })
  senderId!: number;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    validate: {
      notEmpty: { msg: "Message content cannot be empty" },
      len: {
        args: [1, LIMITS.MESSAGE_CONTENT_MAX],
        msg: `Message content must be between 1 and ${LIMITS.MESSAGE_CONTENT_MAX} characters`,
      },
    },
  })
  content!: string;

  @AllowNull(false)
  @Default("text")
  @Column({
    type: DataType.STRING,
    validate: { isIn: { args: [MESSAGE_TYPES], msg: "Invalid message type" } },
  })
  messageType!: MessageType;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    validate: { isUrl: { msg: "Attachment URL must be a valid URL" } },
  })
  attachmentUrl!: string | null;

  @AllowNull(true)
  @ForeignKey(() => Message)
  @Column({ type: DataType.UUID, onDelete: "SET NULL" })
  replyToId!: string | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isEdited!: boolean;

  @AllowNull(true)
  @Column(DataType.DATE)
  editedAt!: Date | null;

  @AllowNull(true)
  @Default([])
  @Column(DataType.ARRAY(DataType.INTEGER))
  readBy!: number[] | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare deletedAt: Date | null;

  @BelongsTo(() => Conversation, {
    foreignKey: "conversationId",
    as: "conversation",
  })
  conversation?: Conversation;

  @BelongsTo(() => User, { foreignKey: "senderId", as: "sender" })
  sender?: User;

  @BelongsTo(() => Message, { foreignKey: "replyToId", as: "replyTo" })
  replyTo?: Message;

  @HasMany(() => Message, { foreignKey: "replyToId", as: "replies" })
  replies?: Message[];

  // --------------------------------------------------------------------------
  // Hooks
  // --------------------------------------------------------------------------

  /** The one place a conversation's lastMessageAt is updated. */
  @AfterCreate
  static async touchConversation(
    message: Message,
    options: CreateOptions<MessageAttributes>,
  ): Promise<void> {
    await Conversation.update(
      { lastMessageAt: message.createdAt ?? new Date() },
      {
        where: { id: message.conversationId },
        transaction: options.transaction,
      },
    );
  }

  // --------------------------------------------------------------------------
  // Instance helpers
  // --------------------------------------------------------------------------

  canModify(userId: number): boolean {
    return this.senderId === userId;
  }

  // --------------------------------------------------------------------------
  // Queries
  // --------------------------------------------------------------------------

  /**
   * Newest-first page of a conversation's messages. Prefer the cursor
   * (`beforeMessageId`); `offset` is supported for simple callers.
   */
  static async getConversationMessages(
    conversationId: string,
    options: {
      limit?: number;
      offset?: number;
      beforeMessageId?: string | null;
    } = {},
  ): Promise<Message[]> {
    const {
      limit = LIMITS.PAGE_LIMIT_DEFAULT,
      offset = 0,
      beforeMessageId = null,
    } = options;

    const where: WhereAttributeHash<MessageAttributes> = { conversationId };
    if (beforeMessageId) {
      const cursor = await this.findByPk(beforeMessageId, {
        attributes: ["createdAt"],
      });
      if (cursor) where.createdAt = { [Op.lt]: cursor.createdAt };
    }

    return this.findAll({
      where,
      include: [includeUser("sender"), includeReplyTo()],
      order: [["createdAt", "DESC"]],
      limit: Math.min(limit, LIMITS.PAGE_LIMIT_MAX),
      offset: beforeMessageId ? 0 : offset,
    });
  }

  static getMessageById(messageId: string): Promise<Message | null> {
    return this.findByPk(messageId, {
      include: [includeUser("sender"), includeReplyTo()],
    });
  }

  private static async findOwned(
    messageId: string,
    userId: number,
  ): Promise<Message> {
    const message = await this.findByPk(messageId);
    if (!message) throw new NotFoundError("Message not found");
    if (!message.canModify(userId)) {
      throw new ForbiddenError("Not authorized to modify this message");
    }
    return message;
  }

  static async editMessage(
    messageId: string,
    userId: number,
    content: string,
    transaction?: Transaction,
  ): Promise<Message> {
    const message = await this.findOwned(messageId, userId);
    await message.update(
      { content, isEdited: true, editedAt: new Date() },
      { transaction },
    );
    return (await this.getMessageById(messageId)) ?? message;
  }

  /** Soft delete (paranoid). */
  static async deleteMessage(
    messageId: string,
    userId: number,
    transaction?: Transaction,
  ): Promise<Message> {
    const message = await this.findOwned(messageId, userId);
    await message.destroy({ transaction });
    return message;
  }

  /** Append `userId` to readBy for every listed message that doesn't already have it. */
  static async markAsRead(
    messageIds: string[],
    userId: number,
    transaction?: Transaction,
  ): Promise<number> {
    if (messageIds.length === 0) return 0;
    const uid = Number(userId); // validated upstream; interpolated into the literal below
    const [affected] = await this.update(
      { readBy: fn("array_append", col("readBy"), uid) },
      {
        where: {
          id: { [Op.in]: messageIds },
          [Op.and]: [
            literal(
              `NOT (COALESCE("readBy", '{}') @> ARRAY[${uid}]::integer[])`,
            ),
          ],
        },
        transaction,
      },
    );
    return affected;
  }
}
