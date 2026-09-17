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
import type { Transaction, WhereOptions } from "sequelize";
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
import type { RelatedEntityType } from "../../shared/types";
import type {
  NotificationAttributes,
  NotificationCreationAttributes,
} from "./types";

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

  static async hasUnread(
    where: WhereOptions<NotificationAttributes>,
  ): Promise<boolean> {
    return (await this.count({ where })) > 0;
  }

  /** Unread message/reply notifications for one conversation; cleared when it's read. */
  static findUnreadForConversation(
    userId: number,
    conversationId: string,
  ): Promise<Notification[]> {
    return this.findAll({
      where: {
        userId,
        type: {
          [Op.in]: [
            NOTIFICATION_TYPES.NEW_MESSAGE,
            NOTIFICATION_TYPES.MESSAGE_REPLY,
          ],
        },
        isRead: false,
        [Op.and]: [
          sqlWhere(literal(`"metadata"->>'conversationId'`), conversationId),
        ],
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

  static createPostLikeNotification(
    userId: number,
    fromUserId: number,
    postId: string,
    transaction?: Transaction,
  ): Promise<Notification> {
    return this.create(
      {
        userId,
        type: NOTIFICATION_TYPES.POST_LIKE,
        title: "New Like",
        message: "Someone liked your post",
        relatedUserId: fromUserId,
        relatedEntityType: "post",
        relatedEntityId: postId,
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
