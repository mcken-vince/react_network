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
import { ConnectionAttributes } from "./types";

@Scopes(() => ({
  pending: {
    where: { status: "pending" },
  },
  accepted: {
    where: { status: "accepted" },
  },
  rejected: {
    where: { status: "rejected" },
  },
  withUsers: {
    include: [
      {
        model: User,
        as: "requester",
        attributes: ["id", "firstName", "lastName", "username", "location"],
      },
      {
        model: User,
        as: "recipient",
        attributes: ["id", "firstName", "lastName", "username", "location"],
      },
    ],
  },
}))
@Table({
  tableName: "connections",
  timestamps: true,
  indexes: [
    { fields: ["requesterId"], name: "idx_connections_requester" },
    { fields: ["recipientId"], name: "idx_connections_recipient" },
    { fields: ["status"], name: "idx_connections_status" },
    { fields: ["createdAt"], name: "idx_connections_created_at" },
    {
      unique: true,
      fields: ["requesterId", "recipientId"],
      name: "unique_connection_pair",
    },
    {
      fields: ["recipientId", "requesterId"],
      name: "idx_connections_reverse",
    },
  ],
  validate: {
    notSelfConnection() {
      if ((this as any).requesterId === (this as any).recipientId) {
        throw new Error("Cannot send connection request to yourself");
      }
    },
  },
})
export default class Connection extends BaseModel<ConnectionAttributes> {
  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, onDelete: "CASCADE" })
  requesterId!: number;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, onDelete: "CASCADE" })
  recipientId!: number;

  @AllowNull(false)
  @Default("pending")
  @Column({
    type: DataType.ENUM("pending", "accepted", "rejected"),
    validate: {
      isIn: {
        args: [["pending", "accepted", "rejected"]] as const,
        msg: "Status must be one of: pending, accepted, rejected",
      },
    },
  })
  status!: "pending" | "accepted" | "rejected";

  // Associations
  @BelongsTo(() => User, { foreignKey: "requesterId", as: "requester" })
  requester!: User;

  @BelongsTo(() => User, { foreignKey: "recipientId", as: "recipient" })
  recipient!: User;

  // ---------------------------------------------------------------------------
  // Relationship helpers (used by post visibility rules)
  // ---------------------------------------------------------------------------

  /**
   * True if the two users have an accepted connection (in either direction).
   */
  static async areConnected(
    userId1: number,
    userId2: number,
  ): Promise<boolean> {
    const count = await this.count({
      where: {
        status: "accepted",
        [Op.or]: [
          { requesterId: userId1, recipientId: userId2 },
          { requesterId: userId2, recipientId: userId1 },
        ],
      },
    });
    return count > 0;
  }

  /**
   * IDs of every user that `userId` has an accepted connection with.
   */
  static async getConnectedUserIds(userId: number): Promise<number[]> {
    const connections = await this.findAll({
      where: {
        status: "accepted",
        [Op.or]: [{ requesterId: userId }, { recipientId: userId }],
      },
      attributes: ["requesterId", "recipientId"],
    });

    return connections.map((c) =>
      c.requesterId === userId ? c.recipientId : c.requesterId,
    );
  }

  // ---------------------------------------------------------------------------
  // Existing static methods
  // ---------------------------------------------------------------------------

  static async sendConnectionRequest(
    requesterId: number,
    recipientId: number,
    transaction?: any,
  ) {
    const existingConnection = await this.findOne({
      where: {
        [Op.or]: [
          { requesterId: requesterId, recipientId: recipientId },
          { requesterId: recipientId, recipientId: requesterId },
        ],
      },
      transaction,
    });

    if (existingConnection) {
      throw new Error("Connection request already exists");
    }

    return this.create({ requesterId, recipientId, status: "pending" } as any, {
      transaction,
    });
  }

  static async acceptConnectionRequest(
    connectionId: number,
    userId: number,
    transaction?: any,
  ) {
    const connection = await this.findOne({
      where: { id: connectionId, recipientId: userId, status: "pending" },
      transaction,
    });
    if (!connection) {
      throw new Error("Connection request not found or not authorized");
    }
    return connection.update({ status: "accepted" }, { transaction });
  }

  static async rejectConnectionRequest(
    connectionId: number,
    userId: number,
    transaction?: any,
  ) {
    const connection = await this.findOne({
      where: { id: connectionId, recipientId: userId, status: "pending" },
      transaction,
    });
    if (!connection) {
      throw new Error("Connection request not found or not authorized");
    }
    return connection.update({ status: "rejected" }, { transaction });
  }

  static async getPendingRequests(userId: number) {
    return this.findAll({
      where: { recipientId: userId, status: "pending" },
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "firstName", "lastName", "username", "location"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  static async getSentRequests(userId: number) {
    return this.findAll({
      where: { requesterId: userId, status: "pending" },
      include: [
        {
          model: User,
          as: "recipient",
          attributes: ["id", "firstName", "lastName", "username", "location"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  static async getUserConnections(userId: number) {
    return this.findAll({
      where: {
        [Op.and]: [
          { [Op.or]: [{ requesterId: userId }, { recipientId: userId }] },
          { status: "accepted" },
        ],
      },
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "firstName", "lastName", "username", "location"],
        },
        {
          model: User,
          as: "recipient",
          attributes: ["id", "firstName", "lastName", "username", "location"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });
  }

  static async getConnectionStatus(userId1: number, userId2: number) {
    const connection = await this.findOne({
      where: {
        [Op.or]: [
          { requesterId: userId1, recipientId: userId2 },
          { requesterId: userId2, recipientId: userId1 },
        ],
      },
    });

    if (!connection) {
      return null;
    }

    return {
      ...connection.toJSON(),
      isRequester: connection.requesterId === userId1,
    };
  }

  static async removeConnection(
    connectionId: number,
    userId: number,
    transaction?: any,
  ) {
    const connection = await this.findOne({
      where: {
        id: connectionId,
        [Op.or]: [{ requesterId: userId }, { recipientId: userId }],
      },
      transaction,
    });
    if (!connection) {
      throw new Error("Connection not found or not authorized");
    }
    await connection.destroy({ transaction });
    return connection;
  }
}
