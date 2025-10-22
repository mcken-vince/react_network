import {
  Table,
  Column,
  DataType,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  Scopes,
  BeforeCreate,
} from "sequelize-typescript";
import { Op } from "sequelize";
import { BaseUuidModel } from "./BaseUuidModel";
import User from "./User.model";
import Conversation from "./Conversation.model";
import { MessageAttributes } from "./types";

@Scopes(() => ({
  withSender: {
    include: [
      {
        model: User,
        as: "sender",
        attributes: ["id", "firstName", "lastName", "username"],
      },
    ],
  },
  withReplyTo: {
    include: [
      {
        model: Message,
        as: "replyTo",
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "firstName", "lastName", "username"],
          },
        ],
      },
    ],
  },
  notDeleted: {
    where: {
      deletedAt: null,
    },
  },
  edited: {
    where: {
      isEdited: true,
    },
  },
}))
@Table({
  tableName: "messages",
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ["conversationId"],
      name: "idx_messages_conversation",
    },
    {
      fields: ["senderId"],
      name: "idx_messages_sender",
    },
    {
      fields: ["createdAt"],
      name: "idx_messages_created_at",
    },
    {
      fields: ["conversationId", "createdAt"],
      name: "idx_messages_conversation_timeline",
    },
    {
      fields: ["replyToId"],
      name: "idx_messages_reply_to",
      where: {
        replyToId: {
          [Op.ne]: null,
        },
      },
    },
  ],
})
export default class Message extends BaseUuidModel<MessageAttributes> {

  @AllowNull(false)
  @ForeignKey(() => Conversation)
  @Column({
    type: DataType.UUID,
    onDelete: "CASCADE",
  })
  conversationId!: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    onDelete: "CASCADE",
  })
  senderId!: number;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    validate: {
      notEmpty: {
        msg: "Message content cannot be empty",
      },
      len: {
        args: [1, 10000],
        msg: "Message content must be between 1 and 10000 characters",
      },
    },
  })
  content!: string;

  @AllowNull(true)
  @Default("text")
  @Column({
    type: DataType.STRING,
    validate: {
      isIn: {
        args: [["text", "image", "file", "system"]],
        msg: "Invalid message type",
      },
    },
  })
  messageType?: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    validate: {
      isUrl: {
        msg: "Attachment URL must be a valid URL",
      },
    },
  })
  attachmentUrl?: string;

  @AllowNull(true)
  @ForeignKey(() => Message)
  @Column({
    type: DataType.UUID,
    onDelete: "SET NULL",
  })
  replyToId?: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isEdited!: boolean;

  @AllowNull(true)
  @Column(DataType.DATE)
  editedAt?: Date;

  @AllowNull(true)
  @Default([])
  @Column(DataType.ARRAY(DataType.INTEGER))
  readBy?: number[] | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare deletedAt?: Date | null;

  // Associations
  @BelongsTo(() => Conversation, {
    foreignKey: "conversationId",
    as: "conversation",
  })
  conversation!: Conversation;

  @BelongsTo(() => User, {
    foreignKey: "senderId",
    as: "sender",
  })
  sender!: User;

  @BelongsTo(() => Message, {
    foreignKey: "replyToId",
    as: "replyTo",
  })
  replyTo?: Message;

  @HasMany(() => Message, {
    foreignKey: "replyToId",
    as: "replies",
  })
  replies!: Message[];

  // Hooks
  @BeforeCreate
  static async updateConversationTimestamp(message: Message) {
    // Update conversation's lastMessageAt timestamp
    await Conversation.update(
      { lastMessageAt: new Date() },
      { where: { id: message.conversationId } }
    );
  }

  /**
   * Check if a user can edit/delete this message
   */
  canModify(userId: number): boolean {
    return this.senderId === userId;
  }

  /**
   * Edit message content
   */
  async editContent(newContent: string, transaction?: any) {
    this.content = newContent;
    this.isEdited = true;
    this.editedAt = new Date();
    return this.save({ transaction });
  }

  /**
   * Mark message as read by a user
   */
  async markAsReadBy(userId: number, transaction?: any) {
    if (!this.readBy) {
      this.readBy = [];
    }
    if (!this.readBy.includes(userId)) {
      this.readBy.push(userId);
      await this.save({ transaction });
    }
    return this;
  }

  // Static methods
  static async createMessage(
    messageData: Partial<MessageAttributes>,
    transaction?: any
  ) {
    // Update conversation's lastMessageAt timestamp
    const conversation = await Conversation.findByPk(
      messageData.conversationId,
      { transaction }
    );

    if (conversation) {
      await conversation.update({ lastMessageAt: new Date() }, { transaction });
    }

    return this.create(messageData as MessageAttributes, { transaction });
  }

  static async getConversationMessages(
    conversationId: string,
    options: {
      limit?: number;
      offset?: number;
      beforeMessageId?: string | null;
    } = {}
  ) {
    const { limit = 50, offset = 0, beforeMessageId = null } = options;

    const whereClause: any = { conversationId };

    // Cursor-based pagination
    if (beforeMessageId) {
      const beforeMessage = await this.findByPk(beforeMessageId);
      if (beforeMessage) {
        whereClause.createdAt = {
          [Op.lt]: beforeMessage.createdAt,
        };
      }
    }

    return this.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "firstName", "lastName", "username"],
        },
        {
          model: Message,
          as: "replyTo",
          required: false,
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "firstName", "lastName", "username"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  }

  static async getMessageById(messageId: string) {
    return this.findByPk(messageId, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "firstName", "lastName", "username"],
        },
        {
          model: Message,
          as: "replyTo",
          required: false,
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "firstName", "lastName", "username"],
            },
          ],
        },
      ],
    });
  }

  static async editMessage(
    messageId: string,
    userId: number,
    newContent: string,
    transaction?: any
  ) {
    const message = await this.findByPk(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (!message.canModify(userId)) {
      throw new Error("User is not authorized to edit this message");
    }

    if (message.deletedAt) {
      throw new Error("Cannot edit deleted message");
    }

    return message.editContent(newContent, transaction);
  }

  static async deleteMessage(
    messageId: string,
    userId: number,
    transaction?: any
  ) {
    const message = await this.findByPk(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (!message.canModify(userId)) {
      throw new Error("User is not authorized to delete this message");
    }

    // Soft delete
    return message.destroy({ transaction });
  }

  static async markAsRead(
    messageIds: string[],
    userId: number,
    transaction?: any
  ) {
    const messages = await this.findAll({
      where: { id: messageIds },
    });

    await Promise.all(
      messages.map((message) => message.markAsReadBy(userId, transaction))
    );

    return messages;
  }

  static async searchMessages(
    conversationId: string,
    searchTerm: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { limit = 20, offset = 0 } = options;

    return this.findAll({
      where: {
        conversationId,
        content: { [Op.iLike]: `%${searchTerm}%` },
        deletedAt: { [Op.is]: null },
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "firstName", "lastName", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  }

  static async getUnreadMessages(conversationId: string, userId: number) {
    return this.findAll({
      where: {
        conversationId,
        senderId: { [Op.ne]: userId },
        [Op.or]: [
          { readBy: { [Op.is]: null } },
          {
            readBy: {
              [Op.not]: {
                [Op.contains]: [userId],
              },
            },
          },
        ],
        deletedAt: { [Op.is]: null },
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "firstName", "lastName", "username"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
  }

  static async getMessageStats(conversationId: string) {
    const [totalCount, editedCount] = await Promise.all([
      this.count({ where: { conversationId } }),
      this.count({ where: { conversationId, isEdited: true } }),
    ]);

    // Count deleted separately due to paranoid mode
    const deletedCount =
      (await this.count({
        where: { conversationId },
        paranoid: false,
      })) - totalCount;

    return {
      totalCount,
      editedCount,
      deletedCount,
      activeCount: totalCount,
    };
  }
}
