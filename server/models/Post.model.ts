import {
  AllowNull,
  BeforeDestroy,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Table,
  HasMany,
} from "sequelize-typescript";
import { Op } from "sequelize";
import type {
  FindOptions,
  InstanceDestroyOptions,
  Order,
  Transaction,
  WhereOptions,
} from "sequelize";
import { BaseUuidModel } from "./BaseUuidModel";
import User from "./User.model";
import Connection from "./Connection.model";
import PostComment from "./PostComment.model";
import Reaction from "./Reaction.model";
import { includeUser } from "./includes";
import { NotFoundError } from "../lib/errors";
import { LIMITS } from "../../shared/limits";
import type { PostVisibility } from "../../shared/types";
import type { PostAttributes, PostCreationAttributes } from "./types";

const ALL_VISIBILITIES: readonly PostVisibility[] = [
  "public",
  "friends",
  "private",
];
const CONNECTION_VISIBILITIES: readonly PostVisibility[] = [
  "public",
  "friends",
];
const STRANGER_VISIBILITIES: readonly PostVisibility[] = ["public"];

const DEFAULT_ORDER: Order = [["createdAt", "DESC"]];

interface ListOptions {
  limit?: number;
  offset?: number;
  order?: Order;
  includeAuthor?: boolean;
}

@Table({
  tableName: "posts",
  timestamps: true,
  indexes: [
    { fields: ["userId"], name: "idx_posts_user" },
    { fields: ["visibility"], name: "idx_posts_visibility" },
    { fields: ["createdAt"], name: "idx_posts_created_at" },
    { fields: ["userId", "createdAt"], name: "idx_posts_user_timeline" },
    { fields: ["visibility", "createdAt"], name: "idx_posts_feed" },
  ],
})
export default class Post extends BaseUuidModel<
  PostAttributes,
  PostCreationAttributes
> {
  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, onDelete: "CASCADE" })
  userId!: number;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    validate: {
      notEmpty: { msg: "Post content cannot be empty" },
      len: {
        args: [1, LIMITS.POST_CONTENT_MAX],
        msg: `Post content must be between 1 and ${LIMITS.POST_CONTENT_MAX} characters`,
      },
    },
  })
  content!: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    validate: { isUrl: { msg: "Image URL must be a valid URL" } },
  })
  imageUrl!: string | null;

  @AllowNull(false)
  @Default("public")
  @Column({
    type: DataType.ENUM(...ALL_VISIBILITIES),
    validate: {
      isIn: {
        args: [ALL_VISIBILITIES],
        msg: `Visibility must be one of: ${ALL_VISIBILITIES.join(", ")}`,
      },
    },
  })
  visibility!: PostVisibility;

  @BelongsTo(() => User, { foreignKey: "userId", as: "author" })
  author?: User;

  @HasMany(() => PostComment, { foreignKey: "postId", as: "comments" })
  comments?: PostComment[];

  // --------------------------------------------------------------------------
  // Hooks
  // --------------------------------------------------------------------------

  /**
   * Reactions have no FK to their target, so clean them up here. Comments are
   * removed by the DB's ON DELETE CASCADE, which never fires PostComment hooks
   * — collect their ids now (before they're gone) and clean theirs up too.
   */
  @BeforeDestroy
  static async removeReactions(
    post: Post,
    options: InstanceDestroyOptions,
  ): Promise<void> {
    const comments = await PostComment.findAll({
      where: { postId: post.id },
      attributes: ["id"],
      transaction: options.transaction,
    });
    await Reaction.deleteForTargets("post", [post.id], options.transaction);
    await Reaction.deleteForTargets(
      "comment",
      comments.map((c) => c.id),
      options.transaction,
    );
  }

  // --------------------------------------------------------------------------
  // Visibility policy — the single source of truth for who can see what
  // --------------------------------------------------------------------------

  /**
   * Which visibility levels of `authorId`'s posts may `viewerId` see?
   *  - self          → public, friends, private
   *  - connected     → public, friends
   *  - everyone else → public
   */
  static async visibleVisibilitiesFor(
    viewerId: number,
    authorId: number,
  ): Promise<readonly PostVisibility[]> {
    if (viewerId === authorId) return ALL_VISIBILITIES;
    const connected = await Connection.areConnected(viewerId, authorId);
    return connected ? CONNECTION_VISIBILITIES : STRANGER_VISIBILITIES;
  }

  static async canUserAccessPost(
    postId: string,
    userId: number,
  ): Promise<boolean> {
    const post = await this.findByPk(postId, {
      attributes: ["userId", "visibility"],
    });
    if (!post) return false;
    const allowed = await this.visibleVisibilitiesFor(userId, post.userId);
    return allowed.includes(post.visibility);
  }

  // --------------------------------------------------------------------------
  // CRUD
  // --------------------------------------------------------------------------

  static createPost(
    data: PostCreationAttributes,
    transaction?: Transaction,
  ): Promise<Post> {
    return this.create(data, { transaction });
  }

  static findPostById(
    postId: string,
    options: FindOptions<PostAttributes> = {},
  ): Promise<Post | null> {
    return this.findByPk(postId, options);
  }

  /** @throws NotFoundError */
  static async updatePost(
    postId: string,
    data: Partial<PostAttributes>,
    transaction?: Transaction,
  ): Promise<Post> {
    const post = await this.findByPk(postId);
    if (!post) throw new NotFoundError("Post not found");
    return post.update(data, { transaction });
  }

  /**
   * Runs in a transaction (the caller's, or a new one) so the reaction
   * cleanup hook and the delete commit or roll back together.
   * @throws NotFoundError
   */
  static async deletePost(
    postId: string,
    transaction?: Transaction,
  ): Promise<Post> {
    const destroyIn = async (t: Transaction): Promise<Post> => {
      const post = await this.findByPk(postId, { transaction: t });
      if (!post) throw new NotFoundError("Post not found");
      await post.destroy({ transaction: t });
      return post;
    };
    if (transaction) return destroyIn(transaction);
    const { sequelize } = this;
    if (!sequelize) throw new Error("Post model is not initialised");
    return sequelize.transaction(destroyIn);
  }

  // --------------------------------------------------------------------------
  // Listing
  // --------------------------------------------------------------------------

  /**
   * Posts by a single author. Pass `visibility` (from `visibleVisibilitiesFor`)
   * to restrict what the caller may see; omit for unrestricted internal use.
   */
  static getUserPosts(
    userId: number,
    options: ListOptions & { visibility?: readonly PostVisibility[] } = {},
  ): Promise<Post[]> {
    const {
      limit = LIMITS.PAGE_LIMIT_DEFAULT,
      offset = 0,
      order = DEFAULT_ORDER,
      includeAuthor = false,
      visibility,
    } = options;
    const where: WhereOptions<PostAttributes> = visibility
      ? { userId, visibility: { [Op.in]: [...visibility] } }
      : { userId };
    return this.findAll({
      where,
      limit,
      offset,
      order,
      include: includeAuthor ? [includeUser("author")] : [],
    });
  }

  /**
   * Feed for `viewerId`: all of their own posts plus public/friends posts from
   * their accepted connections.
   */
  static getFeedPosts(
    viewerId: number,
    connectedUserIds: number[],
    options: ListOptions = {},
  ): Promise<Post[]> {
    const {
      limit = LIMITS.PAGE_LIMIT_DEFAULT,
      offset = 0,
      order = DEFAULT_ORDER,
      includeAuthor = true,
    } = options;
    const where: WhereOptions<PostAttributes> =
      connectedUserIds.length > 0
        ? {
            [Op.or]: [
              { userId: viewerId },
              {
                userId: { [Op.in]: connectedUserIds },
                visibility: { [Op.in]: [...CONNECTION_VISIBILITIES] },
              },
            ],
          }
        : { userId: viewerId };
    return this.findAll({
      where,
      limit,
      offset,
      order,
      include: includeAuthor ? [includeUser("author")] : [],
    });
  }
}
