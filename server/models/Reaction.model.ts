import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from "sequelize-typescript";
import { Op, col, fn } from "sequelize";
import type { Transaction, WhereAttributeHash } from "sequelize";
import { BaseModel } from "./BaseModel";
import User from "./User.model";
import { includeUser } from "./includes";
import {
  REACTION_POLICY,
  REACTION_TARGET_TYPES,
  REACTION_TYPES,
  emptyReactionSummary,
} from "../../shared/reactions";
import type {
  ReactionSummary,
  ReactionTargetType,
  ReactionType,
} from "../../shared/reactions";
import type { ReactionAttributes, ReactionCreationAttributes } from "./types";

/** What a set/clear did, from the acting user's point of view. */
export interface ReactionChange {
  /** The user's reactions on the target before the call, oldest first. */
  before: ReactionType[];
  /** …and after it. */
  after: ReactionType[];
  /** The type this call newly added, if any. */
  added: ReactionType | null;
}

interface CountRow {
  targetId: string;
  type: ReactionType;
  count: string; // pg returns COUNT(*) as a string
}

@Table({
  tableName: "reactions",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["targetType", "targetId", "userId", "type"],
      name: "unique_reaction",
    },
    { fields: ["targetType", "targetId"], name: "idx_reactions_target" },
    { fields: ["userId"], name: "idx_reactions_user" },
  ],
})
export default class Reaction extends BaseModel<
  ReactionAttributes,
  ReactionCreationAttributes
> {
  @AllowNull(false)
  @Column({
    type: DataType.STRING(20),
    validate: {
      isIn: {
        args: [[...REACTION_TARGET_TYPES]],
        msg: `targetType must be one of: ${REACTION_TARGET_TYPES.join(", ")}`,
      },
    },
  })
  targetType!: ReactionTargetType;

  /**
   * posts.id / postComments.id / messages.id (all UUID). No FK — see the
   * cleanup hooks on Post, PostComment and Message.
   */
  @AllowNull(false)
  @Column(DataType.UUID)
  targetId!: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, onDelete: "CASCADE" })
  userId!: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(20),
    validate: {
      isIn: {
        args: [[...REACTION_TYPES]],
        msg: `Reaction type must be one of: ${REACTION_TYPES.join(", ")}`,
      },
    },
  })
  type!: ReactionType;

  @BelongsTo(() => User, { foreignKey: "userId", as: "user" })
  user?: User;

  // --------------------------------------------------------------------------
  // Reads
  // --------------------------------------------------------------------------

  /**
   * One summary per id in `targetIds` (empty when nothing has reacted).
   * Two queries regardless of how many targets are passed.
   */
  static async summarize(
    targetType: ReactionTargetType,
    targetIds: readonly string[],
    viewerId: number,
  ): Promise<Map<string, ReactionSummary>> {
    const result = new Map<string, ReactionSummary>(
      targetIds.map((id): [string, ReactionSummary] => [
        id,
        emptyReactionSummary(),
      ]),
    );
    if (targetIds.length === 0) return result;
    const ids = [...new Set(targetIds)];

    const [counts, mine] = await Promise.all([
      this.findAll({
        attributes: ["targetId", "type", [fn("COUNT", col("id")), "count"]],
        where: { targetType, targetId: { [Op.in]: ids } },
        group: ["targetId", "type"],
        raw: true,
      }) as unknown as Promise<CountRow[]>,
      this.findAll({
        attributes: ["targetId", "type"],
        where: { targetType, targetId: { [Op.in]: ids }, userId: viewerId },
        order: [
          ["createdAt", "ASC"],
          ["id", "ASC"],
        ],
      }),
    ]);

    for (const row of counts) {
      const summary = result.get(row.targetId);
      if (!summary) continue;
      const n = Number(row.count);
      summary.counts[row.type] = n;
      summary.total += n;
    }
    for (const row of mine) {
      result.get(row.targetId)?.mine.push(row.type);
    }
    return result;
  }

  static async summaryFor(
    targetType: ReactionTargetType,
    targetId: string,
    viewerId: number,
  ): Promise<ReactionSummary> {
    const summaries = await this.summarize(targetType, [targetId], viewerId);
    return summaries.get(targetId) ?? emptyReactionSummary();
  }

  /** Newest first; `beforeId` pages into older reactions. */
  static listReactors(
    targetType: ReactionTargetType,
    targetId: string,
    options: { type?: ReactionType; limit: number; beforeId?: number },
  ): Promise<Reaction[]> {
    const where: WhereAttributeHash<ReactionAttributes> = {
      targetType,
      targetId,
    };
    if (options.type) where.type = options.type;
    if (options.beforeId !== undefined) {
      where.id = { [Op.lt]: options.beforeId };
    }
    return this.findAll({
      where,
      include: [includeUser("user")],
      order: [["id", "DESC"]],
      limit: options.limit,
    });
  }

  // --------------------------------------------------------------------------
  // Writes — both honour REACTION_POLICY[targetType]
  // --------------------------------------------------------------------------

  /**
   * Run `work` in a transaction that holds a lock on this (target, user) pair,
   * so the single-reaction rule can't be beaten by concurrent requests. The
   * lock is released on commit/rollback. hashtext() collisions only cause
   * unrelated pairs to briefly serialize — harmless.
   */
  private static async withTargetLock<T>(
    targetType: ReactionTargetType,
    targetId: string,
    userId: number,
    work: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    const { sequelize } = this;
    if (!sequelize) throw new Error("Reaction model is not initialised");
    return sequelize.transaction(async (transaction) => {
      await sequelize.query("SELECT pg_advisory_xact_lock(hashtext(:key))", {
        replacements: { key: `reaction:${targetType}:${targetId}:${userId}` },
        transaction,
      });
      return work(transaction);
    });
  }

  private static async mineLocked(
    targetType: ReactionTargetType,
    targetId: string,
    userId: number,
    transaction: Transaction,
  ): Promise<ReactionType[]> {
    const rows = await this.findAll({
      attributes: ["type"],
      where: { targetType, targetId, userId },
      order: [
        ["createdAt", "ASC"],
        ["id", "ASC"],
      ],
      transaction,
    });
    return rows.map((r) => r.type);
  }

  /**
   * "single": `type` becomes the user's only reaction (others are removed).
   * "multi":  `type` is added alongside any others.
   * Idempotent: re-setting an existing reaction is a no-op.
   */
  static setReaction(
    targetType: ReactionTargetType,
    targetId: string,
    userId: number,
    type: ReactionType,
  ): Promise<ReactionChange> {
    const policy = REACTION_POLICY[targetType];
    return this.withTargetLock(
      targetType,
      targetId,
      userId,
      async (transaction) => {
        const before = await this.mineLocked(
          targetType,
          targetId,
          userId,
          transaction,
        );
        const alreadyHas = before.includes(type);

        if (policy === "single") {
          // Also collapses leftovers from a multi → single policy flip.
          if (before.some((t) => t !== type)) {
            await this.destroy({
              where: { targetType, targetId, userId, type: { [Op.ne]: type } },
              transaction,
            });
          }
          if (!alreadyHas) {
            await this.create(
              { targetType, targetId, userId, type },
              { transaction },
            );
          }
          return { before, after: [type], added: alreadyHas ? null : type };
        }

        if (alreadyHas) return { before, after: before, added: null };
        await this.create(
          { targetType, targetId, userId, type },
          { transaction },
        );
        return { before, after: [...before, type], added: type };
      },
    );
  }

  /**
   * "single": removes the user's reaction; `type` is ignored.
   * "multi":  removes just `type`, or all of the user's reactions if omitted.
   * Idempotent.
   */
  static clearReaction(
    targetType: ReactionTargetType,
    targetId: string,
    userId: number,
    type?: ReactionType,
  ): Promise<ReactionChange> {
    const removeAll =
      REACTION_POLICY[targetType] === "single" || type === undefined;
    return this.withTargetLock(
      targetType,
      targetId,
      userId,
      async (transaction) => {
        const before = await this.mineLocked(
          targetType,
          targetId,
          userId,
          transaction,
        );
        const after = removeAll ? [] : before.filter((t) => t !== type);
        if (after.length !== before.length) {
          await this.destroy({
            where: removeAll
              ? { targetType, targetId, userId }
              : { targetType, targetId, userId, type },
            transaction,
          });
        }
        return { before, after, added: null };
      },
    );
  }

  /** Called from the targets' destroy hooks. */
  static async deleteForTargets(
    targetType: ReactionTargetType,
    targetIds: readonly string[],
    transaction?: Transaction | null,
  ): Promise<number> {
    if (targetIds.length === 0) return 0;
    return this.destroy({
      where: { targetType, targetId: { [Op.in]: [...targetIds] } },
      transaction,
    });
  }
}
