import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from "sequelize-typescript";
import { Op, col, fn } from "sequelize";
import { BaseModel } from "./BaseModel";
import User from "./User.model";
import Post from "./Post.model";
import type { PostLikeAttributes, PostLikeCreationAttributes } from "./types";

@Table({
  tableName: "postLikes",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["postId", "userId"], name: "unique_post_like" },
    { fields: ["postId"], name: "idx_post_likes_post" },
    { fields: ["userId"], name: "idx_post_likes_user" },
  ],
})
export default class PostLike extends BaseModel<
  PostLikeAttributes,
  PostLikeCreationAttributes
> {
  @AllowNull(false)
  @ForeignKey(() => Post)
  @Column({ type: DataType.UUID, onDelete: "CASCADE" })
  postId!: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, onDelete: "CASCADE" })
  userId!: number;

  @BelongsTo(() => Post, { foreignKey: "postId", as: "post" })
  post?: Post;

  @BelongsTo(() => User, { foreignKey: "userId", as: "user" })
  user?: User;

  /** postId → like count, for every post in `postIds` that has at least one. */
  static async countByPost(
    postIds: readonly string[],
  ): Promise<Map<string, number>> {
    if (postIds.length === 0) return new Map();
    const rows = (await this.findAll({
      attributes: ["postId", [fn("COUNT", col("id")), "count"]],
      where: { postId: { [Op.in]: [...postIds] } },
      group: ["postId"],
      raw: true,
    })) as unknown as { postId: string; count: string }[];
    return new Map(rows.map((r) => [r.postId, Number(r.count)]));
  }

  /** Which of `postIds` has `userId` liked? */
  static async likedPostIds(
    postIds: readonly string[],
    userId: number,
  ): Promise<Set<string>> {
    if (postIds.length === 0) return new Set();
    const rows = await this.findAll({
      attributes: ["postId"],
      where: { postId: { [Op.in]: [...postIds] }, userId },
    });
    return new Set(rows.map((r) => r.postId));
  }
}
