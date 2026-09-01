import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Table,
} from "sequelize-typescript";
import { Op } from "sequelize";
import type { Transaction } from "sequelize";
import { BaseModel } from "./BaseModel";
import User from "./User.model";
import { includeUser } from "./includes";
import { ConflictError, NotFoundError } from "../lib/errors";
import type { ConnectionStatus } from "../../shared/types";
import type {
  ConnectionAttributes,
  ConnectionCreationAttributes,
} from "./types";

const STATUSES: readonly ConnectionStatus[] = [
  "pending",
  "accepted",
  "rejected",
];

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
    { fields: ["recipientId", "requesterId"], name: "idx_connections_reverse" },
  ],
  validate: {
    notSelfConnection(this: Connection) {
      if (this.requesterId === this.recipientId) {
        throw new Error("Cannot send connection request to yourself");
      }
    },
  },
})
export default class Connection extends BaseModel<
  ConnectionAttributes,
  ConnectionCreationAttributes
> {
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
    type: DataType.ENUM(...STATUSES),
    validate: {
      isIn: {
        args: [STATUSES],
        msg: `Status must be one of: ${STATUSES.join(", ")}`,
      },
    },
  })
  status!: ConnectionStatus;

  @BelongsTo(() => User, { foreignKey: "requesterId", as: "requester" })
  requester?: User;

  @BelongsTo(() => User, { foreignKey: "recipientId", as: "recipient" })
  recipient?: User;

  // --------------------------------------------------------------------------
  // Relationship helpers (used by post visibility rules)
  // --------------------------------------------------------------------------

  /** True if the two users have an accepted connection in either direction. */
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

  /** IDs of every user `userId` has an accepted connection with. */
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

  // --------------------------------------------------------------------------
  // Request lifecycle
  // --------------------------------------------------------------------------

  /**
   * Create a pending request from `requesterId` to `recipientId`.
   *  - no existing row          → create pending
   *  - existing rejected        → reuse the row as a fresh pending request
   *  - existing pending, theirs → they already asked us: accept it
   *  - existing pending, ours   → ConflictError
   *  - existing accepted        → ConflictError
   * Callers inspect the returned `status` to decide which notification to send.
   */
  static async sendConnectionRequest(
    requesterId: number,
    recipientId: number,
    transaction?: Transaction,
  ): Promise<Connection> {
    const existing = await this.findOne({
      where: {
        [Op.or]: [
          { requesterId, recipientId },
          { requesterId: recipientId, recipientId: requesterId },
        ],
      },
      transaction,
    });

    if (!existing) {
      return this.create(
        { requesterId, recipientId, status: "pending" },
        { transaction },
      );
    }

    switch (existing.status) {
      case "rejected":
        return existing.update(
          { requesterId, recipientId, status: "pending" },
          { transaction },
        );
      case "pending":
        if (existing.recipientId === requesterId) {
          return existing.update({ status: "accepted" }, { transaction });
        }
        throw new ConflictError(
          "You already sent this user a connection request",
        );
      case "accepted":
        throw new ConflictError("You are already connected with this user");
    }
  }

  private static async findPendingForRecipient(
    connectionId: number,
    userId: number,
    transaction?: Transaction,
  ): Promise<Connection> {
    const connection = await this.findOne({
      where: { id: connectionId, recipientId: userId, status: "pending" },
      transaction,
    });
    if (!connection) {
      throw new NotFoundError("Connection request not found or not authorized");
    }
    return connection;
  }

  static async acceptConnectionRequest(
    connectionId: number,
    userId: number,
    transaction?: Transaction,
  ): Promise<Connection> {
    const connection = await this.findPendingForRecipient(
      connectionId,
      userId,
      transaction,
    );
    return connection.update({ status: "accepted" }, { transaction });
  }

  static async rejectConnectionRequest(
    connectionId: number,
    userId: number,
    transaction?: Transaction,
  ): Promise<Connection> {
    const connection = await this.findPendingForRecipient(
      connectionId,
      userId,
      transaction,
    );
    return connection.update({ status: "rejected" }, { transaction });
  }

  /** Removes an accepted connection or cancels a sent request (either party may call). */
  static async removeConnection(
    connectionId: number,
    userId: number,
    transaction?: Transaction,
  ): Promise<Connection> {
    const connection = await this.findOne({
      where: {
        id: connectionId,
        [Op.or]: [{ requesterId: userId }, { recipientId: userId }],
      },
      transaction,
    });
    if (!connection) {
      throw new NotFoundError("Connection not found or not authorized");
    }
    await connection.destroy({ transaction });
    return connection;
  }

  // --------------------------------------------------------------------------
  // Lists
  // --------------------------------------------------------------------------

  /** Incoming pending requests, with the requester embedded. */
  static getPendingRequests(userId: number): Promise<Connection[]> {
    return this.findAll({
      where: { recipientId: userId, status: "pending" },
      include: [includeUser("requester")],
      order: [["createdAt", "DESC"]],
    });
  }

  /** Outgoing pending requests, with the recipient embedded. */
  static getSentRequests(userId: number): Promise<Connection[]> {
    return this.findAll({
      where: { requesterId: userId, status: "pending" },
      include: [includeUser("recipient")],
      order: [["createdAt", "DESC"]],
    });
  }

  /** Accepted connections, both parties embedded. */
  static getUserConnections(userId: number): Promise<Connection[]> {
    return this.findAll({
      where: {
        status: "accepted",
        [Op.or]: [{ requesterId: userId }, { recipientId: userId }],
      },
      include: [includeUser("requester"), includeUser("recipient")],
      order: [["updatedAt", "DESC"]],
    });
  }
}
