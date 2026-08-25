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
} from "sequelize-typescript";
import { Op } from "sequelize";
import { BaseUuidModel } from "./BaseUuidModel";
import User from "./User.model";
import ConversationParticipant from "./ConversationParticipant.model";
import Message from "./Message.model";
import { ConversationAttributes } from "./types";

@Scopes(() => ({
  direct: {
    where: { type: "direct" },
  },
  group: {
    where: { type: "group" },
  },
  withParticipants: {
    include: [
      {
        model: ConversationParticipant,
        as: "participants",
        where: { isActive: true },
        required: false,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "username"],
          },
        ],
      },
    ],
  },
  withCreator: {
    include: [
      {
        model: User,
        as: "creator",
        attributes: ["id", "firstName", "lastName", "username"],
      },
    ],
  },
  withLastMessage: {
    include: [
      {
        model: Message,
        as: "messages",
        limit: 1,
        order: [["createdAt", "DESC"]],
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
  active: {
    include: [
      {
        model: ConversationParticipant,
        as: "allParticipants",
        where: { isActive: true },
        required: true,
      },
    ],
  },
}))
@Table({
  tableName: "conversations",
  timestamps: true,
  indexes: [
    {
      fields: ["type"],
      name: "idx_conversations_type",
    },
    {
      fields: ["createdBy"],
      name: "idx_conversations_creator",
    },
    {
      fields: ["lastMessageAt"],
      name: "idx_conversations_last_message",
    },
    {
      fields: ["createdAt"],
      name: "idx_conversations_created_at",
    },
  ],
})
export default class Conversation extends BaseUuidModel<ConversationAttributes> {
  @AllowNull(false)
  @Default("direct")
  @Column({
    type: DataType.ENUM("direct", "group"),
    validate: {
      isIn: {
        args: [["direct", "group"]] as const,
        msg: "Type must be either 'direct' or 'group'",
      },
    },
  })
  type!: "direct" | "group";

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    validate: {
      len: {
        args: [0, 100],
        msg: "Name must be less than 100 characters",
      },
    },
  })
  name?: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    onDelete: "CASCADE",
  })
  createdBy!: number;

  @AllowNull(true)
  @Column(DataType.DATE)
  lastMessageAt?: Date;

  // Associations
  @BelongsTo(() => User, {
    foreignKey: "createdBy",
    as: "creator",
  })
  creator!: User;

  @HasMany(() => ConversationParticipant, {
    foreignKey: "conversationId",
    as: "participants",
  })
  participants!: ConversationParticipant[];

  @HasMany(() => ConversationParticipant, {
    foreignKey: "conversationId",
    as: "allParticipants",
  })
  allParticipants!: ConversationParticipant[];

  @HasMany(() => Message, {
    foreignKey: "conversationId",
    as: "messages",
  })
  messages!: Message[];

  /**
   * Check if a user is a participant in the conversation
   */
  async hasParticipant(userId: number): Promise<boolean> {
    const participant = await ConversationParticipant.findOne({
      where: {
        conversationId: this.id,
        userId: userId,
        isActive: true,
      },
    });
    return !!participant;
  }

  /**
   * Get all active participants of the conversation
   */
  async getActiveParticipants() {
    return ConversationParticipant.findAll({
      where: {
        conversationId: this.id,
        isActive: true,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "username"],
        },
      ],
    });
  }

  /**
   * Get the last message in the conversation
   */
  async getLastMessage() {
    return Message.findOne({
      where: { conversationId: this.id },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "firstName", "lastName", "username"],
        },
      ],
    });
  }

  /**
   * Get unread message count for a specific user
   */
  async getUnreadCount(userId: number): Promise<number> {
    const participant = await ConversationParticipant.findOne({
      where: {
        conversationId: this.id,
        userId: userId,
        isActive: true,
      },
    });

    if (!participant) {
      return 0;
    }

    const whereClause: any = {
      conversationId: this.id,
      senderId: { [Op.ne]: userId },
    };

    if (participant.lastReadAt) {
      whereClause.createdAt = {
        [Op.gt]: participant.lastReadAt,
      };
    }

    return Message.count({ where: whereClause }) || 0;
  }

  // Static methods
  static async createConversation(
    conversationData: Partial<ConversationAttributes>,
    transaction?: any,
  ) {
    return this.create(conversationData as ConversationAttributes, {
      transaction,
    });
  }

  static async getConversationById(conversationId: string, userId?: number) {
    const conversation = await this.findByPk(conversationId, {
      include: [
        {
          model: ConversationParticipant,
          as: "participants",
          where: { isActive: true },
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName", "username"],
            },
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "firstName", "lastName", "username"],
          required: false,
        },
      ],
    });

    if (!conversation) {
      return null;
    }

    // Check if user is a participant
    if (userId) {
      const isParticipant = await conversation.hasParticipant(userId);
      if (!isParticipant) {
        throw new Error("User is not a participant in this conversation");
      }
    }

    return conversation;
  }

  static async getUserConversations(userId: number, options: any = {}) {
    const { limit = 50, offset = 0 } = options;

    return this.findAll({
      include: [
        {
          model: ConversationParticipant,
          as: "allParticipants",
          where: {
            userId: userId,
            isActive: true,
          },
          required: true,
        },
        {
          model: ConversationParticipant,
          as: "participants",
          where: { isActive: true },
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName", "username"],
            },
          ],
        },
        {
          model: Message,
          as: "messages",
          limit: 1,
          order: [["createdAt", "DESC"]],
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
      order: [["lastMessageAt", "DESC"]],
      limit,
      offset,
      subQuery: false,
    });
  }

  static async findDirectConversation(userId1: number, userId2: number) {
    const conversations = await this.findAll({
      where: { type: "direct" },
      include: [
        {
          model: ConversationParticipant,
          as: "participants",
          where: { isActive: true },
          required: true,
        },
      ],
    });

    for (const conversation of conversations) {
      const participantIds = (conversation.participants || []).map(
        (p: ConversationParticipant) => p.userId,
      );
      if (
        participantIds.length === 2 &&
        participantIds.includes(userId1) &&
        participantIds.includes(userId2)
      ) {
        return conversation;
      }
    }

    return null;
  }

  static async findOrCreateDirectConversation(
    userId1: number,
    userId2: number,
    transaction?: any,
  ) {
    // Check if conversation already exists
    const existing = await this.findDirectConversation(userId1, userId2);
    if (existing) {
      return { created: false, conversation: existing };
    }

    const conversation = await this.createDirectConversation(
      userId1,
      userId2,
      transaction,
    );
    return { created: true, conversation };
  }

  static async createDirectConversation(
    userId1: number,
    userId2: number,
    transaction?: any,
  ) {
    // Check if conversation already exists
    const existing = await this.findDirectConversation(userId1, userId2);
    if (existing) {
      return existing;
    }

    // Create new conversation
    const conversation = await this.create(
      {
        type: "direct",
        createdBy: userId1,
      } as ConversationAttributes,
      { transaction },
    );

    // Add participants
    await Promise.all([
      ConversationParticipant.create(
        {
          conversationId: conversation.id,
          userId: userId1,
          isActive: true,
        } as any,
        { transaction },
      ),
      ConversationParticipant.create(
        {
          conversationId: conversation.id,
          userId: userId2,
          isActive: true,
        } as any,
        { transaction },
      ),
    ]);

    return conversation;
  }

  static async createGroupConversation(
    name: string,
    creatorId: number,
    participantIds: number[],
    transaction?: any,
  ) {
    // Create conversation
    const conversation = await this.create(
      {
        type: "group",
        name,
        createdBy: creatorId,
      } as ConversationAttributes,
      { transaction },
    );

    // Add participants (including creator)
    const uniqueParticipantIds = [...new Set([creatorId, ...participantIds])];
    await Promise.all(
      uniqueParticipantIds.map((userId) =>
        ConversationParticipant.create(
          {
            conversationId: conversation.id,
            userId,
            isActive: true,
            isAdmin: userId === creatorId,
          } as any,
          { transaction },
        ),
      ),
    );

    return conversation;
  }

  static async addParticipant(
    conversationId: string,
    userId: number,
    addedBy: number,
    transaction?: any,
  ) {
    const conversation = await this.findByPk(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if the user adding is a participant
    const isParticipant = await conversation.hasParticipant(addedBy);
    if (!isParticipant) {
      throw new Error("User is not authorized to add participants");
    }

    // Check if user is already a participant
    const existingParticipant = await ConversationParticipant.findOne({
      where: { conversationId, userId },
    });

    if (existingParticipant) {
      if (existingParticipant.isActive) {
        throw new Error("User is already a participant");
      }
      // Reactivate if previously removed
      return existingParticipant.update({ isActive: true }, { transaction });
    }

    return ConversationParticipant.create(
      {
        conversationId,
        userId,
        isActive: true,
      } as any,
      { transaction },
    );
  }

  static async removeParticipant(
    conversationId: string,
    userId: number,
    removedBy: number,
    transaction?: any,
  ) {
    const conversation = await this.findByPk(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if the user removing is a participant
    const isParticipant = await conversation.hasParticipant(removedBy);
    if (!isParticipant) {
      throw new Error("User is not authorized to remove participants");
    }

    const participant = await ConversationParticipant.findOne({
      where: { conversationId, userId, isActive: true },
    });

    if (!participant) {
      throw new Error("Participant not found");
    }

    return participant.update({ isActive: false }, { transaction });
  }

  static async updateConversation(
    conversationId: string,
    updateData: Partial<ConversationAttributes>,
    userId: number,
    transaction?: any,
  ) {
    const conversation = await this.findByPk(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if user is a participant
    const isParticipant = await conversation.hasParticipant(userId);
    if (!isParticipant) {
      throw new Error("User is not authorized to update this conversation");
    }

    return conversation.update(updateData, { transaction });
  }
}
