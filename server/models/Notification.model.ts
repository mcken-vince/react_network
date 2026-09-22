import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Table,
} from "sequelize-typescript";
import { Op, literal, where as sqlWhere } from "sequelize";
import type { Transaction } from "sequelize";
import { BaseModel } from "./BaseModel";
import User from "./User.model";
import { includeUser } from "./includes";
import { NotFoundError } from "../lib/errors";
import { LIMITS } from "../../shared/limits";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_VALUES,
} from "../../shared/notificationTypes";
import type { NotificationType } from "../../shared/notificationTypes";
import { REACTIONS } from "../../shared/reactions";
import type { ReactionTargetType, ReactionType } from "../../shared/reactions";
import type { RelatedEntityType } from "../../shared/types";
import type {
  NotificationAttributes,
  NotificationCreationAttributes,
  ReactionTarget,
} from "./types";

/** Notifications that mean "there's something unread in this chat". */
const MESSAGE_ACTIVITY_TYPES: readonly NotificationType[] = [
  NOTIFICATION_TYPES.NEW_MESSAGE,
  NOTIFICATION_TYPES.MESSAGE_REPLY,
];

const REACTION_NOTIFICATIONS: Record<
  ReactionTargetType,
  { type: NotificationType; entityType: RelatedEntityType; noun: string }
> = {
  post: {
    type: NOTIFICATION_TYPES.POST_REACTION,
    entityType: "post",
    noun: "post",
  },
  comment: {
    type: NOTIFICATION_TYPES.COMMENT_REACTION,
    entityType: "comment",
    noun: "comment",
  },
  message: {
    type: NOTIFICATION_TYPES.MESSAGE_REACTION,
    entityType: "message",
    noun: "message",
  },
};

/** Everything the client needs to render and link the notification. */
function reactionMetadata(
  target: ReactionTarget,
  reactionType: ReactionType,
): Record<string, unknown> {
  switch (target.targetType) {
    case "post":
      return { reactionType };
    case "comment":
      return { reactionType, postId: target.postId };
    case "message":
      return { reactionType, conversationId: target.conversationId };
  }
}

const reactionMessage = (
  target: ReactionTarget,
  reactionType: ReactionType,
): string =>
  `Reacted ${REACTIONS[reactionType].emoji} to your ${REACTION_NOTIFICATIONS[target.targetType].noun}`;

@Table({
  tableName: "notifications",
  timestamps: true,
  indexes: [
    { fields: ["userId"], name: "idx_notifications_user" },
    { fields: ["isRead"], name: "idx_notifications_read_status" },
    { fields: ["type"], name: "idx_notifications_type" },
    { fields: ["createdAt"], name: "idx_notifications_created_at" },
    { fields: ["relatedUserId"], name: "idx_notifications_related_user" },
    {
      fields: ["relatedEntityType", "relatedEntityId"],
      name: "idx_notifications_polymorphic",
    },
  ],
})
export default class Notification extends BaseModel<
  NotificationAttributes,
  NotificationCreationAttributes
> {
  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, onDelete: "CASCADE" })
  userId!: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      isIn: {
        args: [NOTIFICATION_TYPE_VALUES],
        msg: "Invalid notification type",
      },
    },
  })
  type!: NotificationType;

  @AllowNull(true)
  @Column(DataType.STRING)
  title!: string | null;

  @AllowNull(false)
  @Column(DataType.TEXT)
  message!: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isRead!: boolean;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, onDelete: "SET NULL" })
  relatedUserId!: number | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  relatedEntityType!: RelatedEntityType | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  relatedEntityId!: string | null;

  @AllowNull(true)
  @Column(DataType.JSONB)
  metadata!: Record<string, unknown> | null;

  @BelongsTo(() => User, { foreignKey: "userId", as: "user" })
  user?: User;

  @BelongsTo(() => User, { foreignKey: "relatedUserId", as: "relatedUser" })
  relatedUser?: User;

  // --------------------------------------------------------------------------
  // Queries
  // --------------------------------------------------------------------------

  static getUserNotifications(
    userId: number,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {},
  ): Promise<Notification[]> {
    const {
      limit = LIMITS.PAGE_LIMIT_DEFAULT,
      offset = 0,
      unreadOnly = false,
    } = options;
    return this.findAll({
      where: { userId, ...(unreadOnly && { isRead: false }) },
      include: [includeUser("relatedUser")],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  }

  static getUnreadCount(userId: number): Promise<number> {
    return this.count({ where: { userId, isRead: false } });
  }

  private static async findOwned(
    notificationId: number,
    userId: number,
    transaction?: Transaction,
  ): Promise<Notification> {
    const notification = await this.findOne({
      where: { id: notificationId, userId },
      transaction,
    });
    if (!notification) {
      throw new NotFoundError("Notification not found or not authorized");
    }
    return notification;
  }

  static async markAsRead(
    notificationId: number,
    userId: number,
    transaction?: Transaction,
  ): Promise<Notification> {
    const notification = await this.findOwned(
      notificationId,
      userId,
      transaction,
    );
    return notification.update({ isRead: true }, { transaction });
  }

  static async markAllAsRead(
    userId: number,
    transaction?: Transaction,
  ): Promise<number> {
    const [affected] = await this.update(
      { isRead: true },
      { where: { userId, isRead: false }, transaction },
    );
    return affected;
  }

  static async deleteNotification(
    notificationId: number,
    userId: number,
    transaction?: Transaction,
  ): Promise<Notification> {
    const notification = await this.findOwned(
      notificationId,
      userId,
      transaction,
    );
    await notification.destroy({ transaction });
    return notification;
  }

  /**
   * Unread notifications tied to one conversation. By default only message
   * activity (used to dedupe "new message"); pass `includeReactions` to also
   * match reaction notifications (used when the chat is opened and read).
   */
  static findUnreadForConversation(
    userId: number,
    conversationId: string,
    options: { includeReactions?: boolean } = {},
  ): Promise<Notification[]> {
    const types = options.includeReactions
      ? [...MESSAGE_ACTIVITY_TYPES, NOTIFICATION_TYPES.MESSAGE_REACTION]
      : [...MESSAGE_ACTIVITY_TYPES];
    return this.findAll({
      where: {
        userId,
        type: { [Op.in]: types },
        isRead: false,
        [Op.and]: [
          sqlWhere(literal(`"metadata"->>'conversationId'`), conversationId),
        ],
      },
    });
  }

  /** The unread notification for `fromUserId` reacting to `target`, if any. */
  static findUnreadReaction(
    userId: number,
    fromUserId: number,
    target: ReactionTarget,
  ): Promise<Notification | null> {
    const config = REACTION_NOTIFICATIONS[target.targetType];
    return this.findOne({
      where: {
        userId,
        relatedUserId: fromUserId,
        type: config.type,
        isRead: false,
        relatedEntityType: config.entityType,
        relatedEntityId: target.targetId,
      },
    });
  }

  // --------------------------------------------------------------------------
  // Factories
  // --------------------------------------------------------------------------

  static createMessageReplyNotification(
    userId: number,
    fromUserId: number,
    messageId: string,
    conversationId: string,
    repliedToMessageId: string,
    messagePreview: string,
    transaction?: Transaction,
  ): Promise<Notification> {
    return this.create(
      {
        userId,
        type: NOTIFICATION_TYPES.MESSAGE_REPLY,
        title: "New Reply",
        message: messagePreview.substring(0, 100),
        relatedUserId: fromUserId,
        relatedEntityType: "message",
        relatedEntityId: messageId,
        metadata: { conversationId, repliedToMessageId },
      },
      { transaction },
    );
  }

  private static createConnectionNotification(
    type: NotificationType,
    title: string,
    message: string,
    userId: number,
    fromUserId: number,
    connectionId: number,
    transaction?: Transaction,
  ): Promise<Notification> {
    return this.create(
      {
        userId,
        type,
        title,
        message,
        relatedUserId: fromUserId,
        relatedEntityType: "connection",
        relatedEntityId: String(connectionId),
      },
      { transaction },
    );
  }

  static createConnectionRequestNotification(
    userId: number,
    fromUserId: number,
    connectionId: number,
    transaction?: Transaction,
  ): Promise<Notification> {
    return this.createConnectionNotification(
      NOTIFICATION_TYPES.CONNECTION_REQUEST,
      "New Connection Request",
      "You have a new connection request",
      userId,
      fromUserId,
      connectionId,
      transaction,
    );
  }

  static createConnectionAcceptedNotification(
    userId: number,
    fromUserId: number,
    connectionId: number,
    transaction?: Transaction,
  ): Promise<Notification> {
    return this.createConnectionNotification(
      NOTIFICATION_TYPES.CONNECTION_ACCEPTED,
      "Connection Accepted",
      "Your connection request has been accepted",
      userId,
      fromUserId,
      connectionId,
      transaction,
    );
  }

  static createConnectionRejectedNotification(
    userId: number,
    fromUserId: number,
    connectionId: number,
    transaction?: Transaction,
  ): Promise<Notification> {
    return this.createConnectionNotification(
      NOTIFICATION_TYPES.CONNECTION_REJECTED,
      "Connection Rejected",
      "Your connection request has been rejected",
      userId,
      fromUserId,
      connectionId,
      transaction,
    );
  }

  static createMessageNotification(
    userId: number,
    fromUserId: number,
    messageId: string,
    conversationId: string,
    messagePreview: string,
    transaction?: Transaction,
  ): Promise<Notification> {
    return this.create(
      {
        userId,
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        title: "New Message",
        message: messagePreview.substring(0, 100),
        relatedUserId: fromUserId,
        relatedEntityType: "message",
        relatedEntityId: messageId,
        metadata: { conversationId },
      },
      { transaction },
    );
  }

  static createReactionNotification(
    userId: number,
    fromUserId: number,
    target: ReactionTarget,
    reactionType: ReactionType,
    transaction?: Transaction,
  ): Promise<Notification> {
    const config = REACTION_NOTIFICATIONS[target.targetType];
    return this.create(
      {
        userId,
        type: config.type,
        title: "New Reaction",
        message: reactionMessage(target, reactionType),
        relatedUserId: fromUserId,
        relatedEntityType: config.entityType,
        relatedEntityId: target.targetId,
        metadata: reactionMetadata(target, reactionType),
      },
      { transaction },
    );
  }

  /** Point an unread reaction notification at the reactor's latest reaction. */
  static refreshReactionNotification(
    notification: Notification,
    target: ReactionTarget,
    reactionType: ReactionType,
    transaction?: Transaction,
  ): Promise<Notification> {
    return notification.update(
      {
        message: reactionMessage(target, reactionType),
        metadata: reactionMetadata(target, reactionType),
      },
      { transaction },
    );
  }

  static createPostCommentNotification(
    userId: number,
    fromUserId: number,
    postId: string,
    commentId: string,
    commentPreview: string,
    transaction?: Transaction,
  ): Promise<Notification> {
    return this.create(
      {
        userId,
        type: NOTIFICATION_TYPES.POST_COMMENT,
        title: "New Comment",
        message: commentPreview.substring(0, 100),
        relatedUserId: fromUserId,
        relatedEntityType: "post",
        relatedEntityId: postId,
        metadata: { commentId },
      },
      { transaction },
    );
  }
}
