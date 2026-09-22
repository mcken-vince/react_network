import {
  AfterDestroy,
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from "sequelize-typescript";
import { Op, col, fn } from "sequelize";
import type { InstanceDestroyOptions, WhereAttributeHash } from "sequelize";
import { BaseUuidModel } from "./BaseUuidModel";
import User from "./User.model";
import Post from "./Post.model";
import Reaction from "./Reaction.model";
import { includeUser } from "./includes";
import { LIMITS } from "../../shared/limits";
import type {
  PostCommentAttributes,
  PostCommentCreationAttributes,
} from "./types";

@Table({
  tableName: "postComments",
  timestamps: true,
  indexes: [
    { fields: ["postId"], name: "idx_post_comments_post" },
    { fields: ["userId"], name: "idx_post_comments_user" },
    { fields: ["postId", "createdAt"], name: "idx_post_comments_timeline" },
  ],
})
export default class PostComment extends BaseUuidModel<
  PostCommentAttributes,
  PostCommentCreationAttributes
> {
  @AllowNull(false)
  @ForeignKey(() => Post)
  @Column({ type: DataType.UUID, onDelete: "CASCADE" })
  postId!: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, onDelete: "CASCADE" })
  userId!: number;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    validate: {
      notEmpty: { msg: "Comment cannot be empty" },
      len: {
        args: [1, LIMITS.COMMENT_CONTENT_MAX],
        msg: `Comment must be between 1 and ${LIMITS.COMMENT_CONTENT_MAX} characters`,
      },
    },
  })
  content!: string;

  @BelongsTo(() => Post, { foreignKey: "postId", as: "post" })
  post?: Post;

  @BelongsTo(() => User, { foreignKey: "userId", as: "author" })
  author?: User;

  /** Reactions have no FK to their target. (Post deletion handles its comments' reactions itself.) */
  @AfterDestroy
  static async removeReactions(
    comment: PostComment,
    options: InstanceDestroyOptions,
  ): Promise<void> {
    await Reaction.deleteForTargets(
      "comment",
      [comment.id],
      options.transaction,
    );
  }

  /** Newest-first page; pass `beforeCommentId` to page into older comments. */
  static async getPostComments(
    postId: string,
    options: { limit?: number; beforeCommentId?: string | null } = {},
  ): Promise<PostComment[]> {
    const { limit = LIMITS.PAGE_LIMIT_DEFAULT, beforeCommentId = null } =
      options;
    const where: WhereAttributeHash<PostCommentAttributes> = { postId };
    if (beforeCommentId) {
      const cursor = await this.findByPk(beforeCommentId, {
        attributes: ["createdAt"],
      });
      if (cursor) where.createdAt = { [Op.lt]: cursor.createdAt };
    }
    return this.findAll({
      where,
      include: [includeUser("author")],
      order: [["createdAt", "DESC"]],
      limit: Math.min(limit, LIMITS.PAGE_LIMIT_MAX),
    });
  }

  static getCommentById(commentId: string): Promise<PostComment | null> {
    return this.findByPk(commentId, { include: [includeUser("author")] });
  }

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
}
