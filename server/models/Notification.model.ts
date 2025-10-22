import {
  Table,
  Column,
  DataType,
  AllowNull,
  ForeignKey,
  BelongsTo,
  Default,
  Scopes,
} from "sequelize-typescript";
import { Op } from "sequelize";
import { BaseModel } from "./BaseModel";
import User from "./User.model";
import { NOTIFICATION_TYPES } from "../config/notificationTypes";
import { NotificationAttributes } from "./types";

@Scopes(() => ({
  unread: {
    where: { isRead: false },
  },
  recent: {
    order: [["createdAt", "DESC"]],
    limit: 20,
  },
  withRelatedUser: {
    include: [
      {
        model: User,
        as: "relatedUser",
        attributes: ["id", "firstName", "lastName", "username"],
      },
    ],
  },
  byType: (type: string) => ({
    where: { type },
  }),
  today: {
    where: {
      createdAt: {
        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  },
}))
@Table({
  tableName: "notifications",
  timestamps: true,
  indexes: [
    {
      fields: ["userId"],
      name: "idx_notifications_user",
    },
    {
      fields: ["isRead"],
      name: "idx_notifications_read_status",
    },
    {
      fields: ["type"],
      name: "idx_notifications_type",
    },
    {
      fields: ["createdAt"],
      name: "idx_notifications_created_at",
    },
    {
      fields: ["relatedUserId"],
      name: "idx_notifications_related_user",
    },
    {
      fields: ["relatedEntityType", "relatedEntityId"],
      name: "idx_notifications_polymorphic",
    },
  ],
})
export default class Notification extends BaseModel<NotificationAttributes> {
  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    onDelete: "CASCADE",
  })
  userId!: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      isIn: {
        args: [Object.values(NOTIFICATION_TYPES)],
        msg: "Invalid notification type",
      },
    },
  })
  type!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  message!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  title?: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isRead!: boolean;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    onDelete: "SET NULL",
  })
  relatedUserId?: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  relatedEntityType?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  relatedEntityId?: string;

  @AllowNull(true)
  @Column(DataType.JSONB)
  metadata?: any;

  // Associations
  @BelongsTo(() => User, {
    foreignKey: "userId",
    as: "user",
  })
  user!: User;

  @BelongsTo(() => User, {
    foreignKey: "relatedUserId",
    as: "relatedUser",
  })
  relatedUser?: User;

  /**
   * Helper method to get the related entity dynamically
   * This allows us to fetch the associated model based on the polymorphic type
   */
  async getRelatedEntity() {
    if (!this.relatedEntityType || !this.relatedEntityId) {
      return null;
    }

    const modelMap: Record<string, any> = {
      connection: Connection,
      conversation: Conversation,
      message: Message,
      post: Post,
      user: User,
    };

    const Model = modelMap[this.relatedEntityType];
    if (!Model) {
      return null;
    }

    return await Model.findByPk(this.relatedEntityId);
  }

  // Static methods
  static async createNotification(
    notificationData: Partial<NotificationAttributes>,
    transaction?: any
  ) {
    return this.create(notificationData as NotificationAttributes, {
      transaction,
    });
  }

  static async getUserNotifications(
    userId: number,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: string | null;
    } = {}
  ) {
    const { limit = 50, offset = 0, unreadOnly = false, type = null } = options;

    const whereClause: any = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }
    if (type) {
      whereClause.type = type;
    }

    return this.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "relatedUser",
          attributes: ["id", "firstName", "lastName", "username"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  }

  static async markAsRead(
    notificationId: number,
    userId: number,
    transaction?: any
  ) {
    const notification = await this.findOne({
      where: {
        id: notificationId,
        userId: userId,
      },
      transaction,
    });

    if (!notification) {
      throw new Error("Notification not found or not authorized");
    }

    return notification.update({ isRead: true }, { transaction });
  }

  static async markAllAsRead(userId: number, transaction?: any) {
    return this.update(
      { isRead: true },
      {
        where: {
          userId: userId,
          isRead: false,
        },
        transaction,
      }
    );
  }

  static async markMultipleAsRead(
    notificationIds: number[],
    userId: number,
    transaction?: any
  ) {
    return this.update(
      { isRead: true },
      {
        where: {
          id: { [Op.in]: notificationIds },
          userId: userId,
          isRead: false,
        },
        transaction,
      }
    );
  }

  static async deleteOldNotifications(daysOld: number = 30, transaction?: any) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoffDate,
        },
        isRead: true, // Only delete read notifications
      },
      transaction,
    });
  }

  static async getUnreadCount(userId: number): Promise<number> {
    return this.count({
      where: {
        userId: userId,
        isRead: false,
      },
    });
  }

  static async deleteNotification(
    notificationId: number,
    userId: number,
    transaction?: any
  ) {
    const notification = await this.findOne({
      where: {
        id: notificationId,
        userId: userId,
      },
      transaction,
    });

    if (!notification) {
      throw new Error("Notification not found or not authorized");
    }

    await notification.destroy({ transaction });
    return notification;
  }

  static async getNotificationStats(userId: number) {
    const [totalCount, unreadCount, typeStats] = await Promise.all([
      this.count({ where: { userId } }),
      this.count({ where: { userId, isRead: false } }),
      this.findAll({
        where: { userId },
        attributes: [
          "type",
          [this.sequelize!.fn("COUNT", this.sequelize!.col("type")), "count"],
        ],
        group: ["type"],
        raw: true,
      }),
    ]);

    return {
      totalCount,
      unreadCount,
      readCount: totalCount - unreadCount,
      typeStats,
    };
  }

  /**
   * Create a connection request notification
   */
  static async createConnectionNotification(
    userId: number,
    fromUserId: number,
    connectionId: number,
    transaction?: any
  ) {
    return this.create(
      {
        userId,
        type: NOTIFICATION_TYPES.CONNECTION_REQUEST,
        title: "New Connection Request",
        message: "You have a new connection request",
        relatedUserId: fromUserId,
        relatedEntityType: "connection",
        relatedEntityId: connectionId,
        isRead: false,
      },
      { transaction }
    );
  }

  /**
   * Create a connection request notification (alias for compatibility)
   */
  static async createConnectionRequestNotification(
    userId: number,
    fromUserId: number,
    connectionId: number,
    transaction?: any
  ) {
    return this.createConnectionNotification(
      userId,
      fromUserId,
      connectionId,
      transaction
    );
  }

  /**
   * Create a connection accepted notification
   */
  static async createConnectionAcceptedNotification(
    userId: number,
    fromUserId: number,
    connectionId: number,
    transaction?: any
  ) {
    return this.create(
      {
        userId,
        type: NOTIFICATION_TYPES.CONNECTION_ACCEPTED,
        title: "Connection Accepted",
        message: "Your connection request has been accepted",
        relatedUserId: fromUserId,
        relatedEntityType: "connection",
        relatedEntityId: connectionId,
        isRead: false,
      },
      { transaction }
    );
  }

  /**
   * Create a connection rejected notification
   */
  static async createConnectionRejectedNotification(
    userId: number,
    fromUserId: number,
    connectionId: number,
    transaction?: any
  ) {
    return this.create(
      {
        userId,
        type: NOTIFICATION_TYPES.CONNECTION_REJECTED,
        title: "Connection Rejected",
        message: "Your connection request has been rejected",
        relatedUserId: fromUserId,
        relatedEntityType: "connection",
        relatedEntityId: connectionId,
        isRead: false,
      } as NotificationAttributes,
      { transaction }
    );
  }

  /**
   * Create a message notification
   */
  static async createMessageNotification(
    userId: number,
    fromUserId: number,
    messageId: string,
    conversationId: string,
    messagePreview: string,
    transaction?: any
  ) {
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
        isRead: false,
      } as NotificationAttributes,
      { transaction }
    );
  }

  /**
   * Create a post notification (like, comment, or share)
   */
  static async createPostNotification(
    userId: number,
    postAuthorId: number,
    postId: string,
    postPreview: string,
    notificationType: "like" | "comment" | "share" = "like",
    transaction?: any
  ) {
    const typeMap = {
      like: NOTIFICATION_TYPES.POST_LIKE,
      comment: NOTIFICATION_TYPES.POST_COMMENT,
      share: NOTIFICATION_TYPES.POST_SHARE,
    };

    const titleMap = {
      like: "Post Liked",
      comment: "New Comment on Post",
      share: "Post Shared",
    };

    return this.create(
      {
        userId,
        type: typeMap[notificationType],
        title: titleMap[notificationType],
        message: postPreview.substring(0, 100),
        relatedUserId: postAuthorId,
        relatedEntityType: "post",
        relatedEntityId: postId,
        isRead: false,
      } as NotificationAttributes,
      { transaction }
    );
  }
}

// Import these after the class definition to avoid circular dependencies
import Connection from "./Connection.model";
import Conversation from "./Conversation.model";
import Message from "./Message.model";
import Post from "./Post.model";
