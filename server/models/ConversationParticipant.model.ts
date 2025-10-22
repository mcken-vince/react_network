import {
  Table,
  Column,
  DataType,
  AllowNull,
  ForeignKey,
  BelongsTo,
  Default,
} from "sequelize-typescript";
import { BaseUuidModel } from "./BaseUuidModel";
import User from "./User.model";
import Conversation from "./Conversation.model";
import { ConversationParticipantAttributes } from "./types";

@Table({
  tableName: "conversationParticipants",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["conversationId", "userId"],
      name: "unique_conversation_participant",
    },
    {
      fields: ["conversationId"],
      name: "idx_participants_conversation",
    },
    {
      fields: ["userId"],
      name: "idx_participants_user",
    },
    {
      fields: ["isActive"],
      name: "idx_participants_active",
    },
    {
      fields: ["lastReadAt"],
      name: "idx_participants_last_read",
    },
  ],
})
export default class ConversationParticipant extends BaseUuidModel<ConversationParticipantAttributes> {

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
  userId!: number;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    validate: {
      len: {
        args: [0, 50],
        msg: "Role must be less than 50 characters",
      },
    },
  })
  role?: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isAdmin!: boolean;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @AllowNull(true)
  @Default(() => new Date())
  @Column(DataType.DATE)
  joinedAt?: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  lastReadAt?: Date;

  // Associations
  @BelongsTo(() => Conversation, {
    foreignKey: "conversationId",
    as: "conversation",
  })
  conversation!: Conversation;

  @BelongsTo(() => User, {
    foreignKey: "userId",
    as: "user",
  })
  user!: User;

  // Static methods
  static async markAsRead(
    conversationId: string,
    userId: number,
    transaction?: any
  ) {
    const participant = await this.findOne({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error("Participant not found");
    }

    return participant.update({ lastReadAt: new Date() }, { transaction });
  }

  static async getParticipant(conversationId: string, userId: number) {
    return this.findOne({
      where: {
        conversationId,
        userId,
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

  static async getConversationParticipants(
    conversationId: string,
    options: { includeInactive?: boolean } = {}
  ) {
    const { includeInactive = false } = options;
    const whereClause: any = { conversationId };
    
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    return this.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "username", "location"],
        },
      ],
      order: [["joinedAt", "ASC"]],
    });
  }

  static async getUserConversations(userId: number) {
    return this.findAll({
      where: {
        userId,
        isActive: true,
      },
      include: [
        {
          model: Conversation,
          as: "conversation",
          include: [
            {
              model: ConversationParticipant,
              as: "participants",
              where: { isActive: true },
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
      ],
      order: [["lastReadAt", "DESC"]],
    });
  }

  static async updateParticipantRole(
    conversationId: string,
    userId: number,
    role: string,
    updatedBy: number,
    transaction?: any
  ) {
    // Check if the user updating has admin privileges
    const updaterParticipant = await this.findOne({
      where: {
        conversationId,
        userId: updatedBy,
        isActive: true,
        isAdmin: true,
      },
    });

    if (!updaterParticipant) {
      throw new Error("User is not authorized to update participant roles");
    }

    const participant = await this.findOne({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error("Participant not found");
    }

    return participant.update({ role }, { transaction });
  }

  static async makeAdmin(
    conversationId: string,
    userId: number,
    promotedBy: number,
    transaction?: any
  ) {
    // Check if the user promoting has admin privileges
    const promoterParticipant = await this.findOne({
      where: {
        conversationId,
        userId: promotedBy,
        isActive: true,
        isAdmin: true,
      },
    });

    if (!promoterParticipant) {
      throw new Error("User is not authorized to promote participants");
    }

    const participant = await this.findOne({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error("Participant not found");
    }

    if (participant.isAdmin) {
      throw new Error("Participant is already an admin");
    }

    return participant.update({ isAdmin: true }, { transaction });
  }

  static async removeAdmin(
    conversationId: string,
    userId: number,
    removedBy: number,
    transaction?: any
  ) {
    // Check if the user removing admin has admin privileges
    const removerParticipant = await this.findOne({
      where: {
        conversationId,
        userId: removedBy,
        isActive: true,
        isAdmin: true,
      },
    });

    if (!removerParticipant) {
      throw new Error("User is not authorized to remove admin privileges");
    }

    const participant = await this.findOne({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error("Participant not found");
    }

    if (!participant.isAdmin) {
      throw new Error("Participant is not an admin");
    }

    // Check if there will be at least one admin left
    const adminCount = await this.count({
      where: {
        conversationId,
        isActive: true,
        isAdmin: true,
      },
    });

    if (adminCount <= 1) {
      throw new Error("Cannot remove the last admin from the conversation");
    }

    return participant.update({ isAdmin: false }, { transaction });
  }
}
