import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Table,
} from "sequelize-typescript";
import type { Transaction } from "sequelize";
import { BaseUuidModel } from "./BaseUuidModel";
import User from "./User.model";
import Conversation from "./Conversation.model";
import { ForbiddenError } from "../lib/errors";
import type {
  ConversationParticipantAttributes,
  ConversationParticipantCreationAttributes,
} from "./types";

@Table({
  tableName: "conversationParticipants",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["conversationId", "userId"],
      name: "unique_conversation_participant",
    },
    { fields: ["conversationId"], name: "idx_participants_conversation" },
    { fields: ["userId"], name: "idx_participants_user" },
    { fields: ["isActive"], name: "idx_participants_active" },
    { fields: ["lastReadAt"], name: "idx_participants_last_read" },
  ],
})
export default class ConversationParticipant extends BaseUuidModel<
  ConversationParticipantAttributes,
  ConversationParticipantCreationAttributes
> {
  @AllowNull(false)
  @ForeignKey(() => Conversation)
  @Column({ type: DataType.UUID, onDelete: "CASCADE" })
  conversationId!: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, onDelete: "CASCADE" })
  userId!: number;

  @AllowNull(true)
  @Column(DataType.STRING(50))
  role!: string | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isAdmin!: boolean;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @AllowNull(true)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  joinedAt!: Date | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  lastReadAt!: Date | null;

  @BelongsTo(() => Conversation, {
    foreignKey: "conversationId",
    as: "conversation",
  })
  conversation?: Conversation;

  @BelongsTo(() => User, { foreignKey: "userId", as: "user" })
  user?: User;

  /** @throws ForbiddenError if the user is not an active participant */
  static async markAsRead(
    conversationId: string,
    userId: number,
    transaction?: Transaction,
  ): Promise<ConversationParticipant> {
    const participant = await this.findOne({
      where: { conversationId, userId, isActive: true },
      transaction,
    });
    if (!participant) {
      throw new ForbiddenError("Not a participant in this conversation");
    }
    return participant.update({ lastReadAt: new Date() }, { transaction });
  }
}
