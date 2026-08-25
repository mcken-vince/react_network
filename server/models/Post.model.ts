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
import { BaseUuidModel } from "./BaseUuidModel";
import User from "./User.model";
import Connection from "./Connection.model";
import { PostAttributes } from "./types";

export type PostVisibility = PostAttributes["visibility"];

const ALL_VISIBILITIES: PostVisibility[] = ["public", "friends", "private"];
const CONNECTION_VISIBILITIES: PostVisibility[] = ["public", "friends"];
const STRANGER_VISIBILITIES: PostVisibility[] = ["public"];

// Function (not a constant) so `User` is resolved at call time, not module load time.
const authorInclude = () => ({
  model: User,
  as: "author",
  attributes: ["id", "firstName", "lastName", "username", "location"],
});

interface ListOptions {
  limit?: number;
  offset?: number;
  order?: any;
  includeAuthor?: boolean;
}

@Scopes(() => ({
  public: { where: { visibility: "public" } },
  friends: { where: { visibility: "friends" } },
  private: { where: { visibility: "private" } },
  withAuthor: { include: [authorInclude()] },
  recent: { order: [["createdAt", "DESC"]], limit: 10 },
}))
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
export default class Post extends BaseUuidModel<PostAttributes> {
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
        args: [1, 5000],
        msg: "Post content must be between 1 and 5000 characters",
      },
    },
  })
  content!: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    validate: { isUrl: { msg: "Image URL must be a valid URL" } },
  })
  imageUrl?: string;

  @AllowNull(false)
  @Default("public")
  @Column({
    type: DataType.ENUM("public", "friends", "private"),
    validate: {
      isIn: {
        args: [["public", "friends", "private"]] as const,
        msg: "Visibility must be one of: public, friends, private",
      },
    },
  })
  visibility!: PostVisibility;

  // Associations
  @BelongsTo(() => User, { foreignKey: "userId", as: "author" })
  author!: User;

  // ---------------------------------------------------------------------------
  // Visibility policy — the single source of truth for who can see what
  // ---------------------------------------------------------------------------

  /**
   * Which visibility levels of `authorId`'s posts may `viewerId` see?
   *  - self          → public, friends, private
   *  - connected     → public, friends
   *  - everyone else → public
   */
  static async visibleVisibilitiesFor(
    viewerId: number,
    authorId: number,
  ): Promise<PostVisibility[]> {
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

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  static async createPost(
    postData: Partial<PostAttributes>,
    transaction?: any,
  ) {
    return this.create(postData as PostAttributes, { transaction });
  }

  static async findPostById(postId: string, options: any = {}) {
    return this.findByPk(postId, options);
  }

  static async updatePost(
    postId: string,
    updateData: Partial<PostAttributes>,
    transaction?: any,
  ) {
    const post = await this.findByPk(postId);
    if (!post) return null;
    return post.update(updateData, { transaction });
  }

  static async deletePost(postId: string, transaction?: any) {
    const post = await this.findByPk(postId);
    if (!post) return null;
    await post.destroy({ transaction });
    return post;
  }

  // ---------------------------------------------------------------------------
  // Listing
  // ---------------------------------------------------------------------------

  /**
   * Posts by a single author. Pass `visibility` (from `visibleVisibilitiesFor`)
   * to restrict what the caller is allowed to see; omit for unrestricted
   * internal use.
   */
  static async getUserPosts(
    userId: number,
    options: ListOptions & { visibility?: PostVisibility[] } = {},
  ) {
    const {
      limit = 50,
      offset = 0,
      order = [["createdAt", "DESC"]],
      includeAuthor = false,
      visibility,
    } = options;

    const where: any = { userId };
    if (visibility) {
      where.visibility = { [Op.in]: visibility };
    }

    return this.findAll({
      where,
      limit,
      offset,
      order,
      ...(includeAuthor && { include: [authorInclude()] }),
    });
  }

  /**
   * Feed for `viewerId`: all of their own posts plus public/friends posts
   * from their accepted connections.
   */
  static async getFeedPosts(
    viewerId: number,
    connectedUserIds: number[],
    options: ListOptions = {},
  ) {
    const {
      limit = 50,
      offset = 0,
      order = [["createdAt", "DESC"]],
      includeAuthor = true,
    } = options;

    const ownPosts = { userId: viewerId };
    const where =
      connectedUserIds.length > 0
        ? {
            [Op.or]: [
              ownPosts,
              {
                userId: { [Op.in]: connectedUserIds },
                visibility: { [Op.in]: CONNECTION_VISIBILITIES },
              },
            ],
          }
        : ownPosts;

    return this.findAll({
      where,
      limit,
      offset,
      order,
      ...(includeAuthor && { include: [authorInclude()] }),
    });
  }

  static async getPublicPosts(options: ListOptions = {}) {
    const { limit = 50, offset = 0, includeAuthor = true } = options;

    return this.findAll({
      where: { visibility: "public" },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      ...(includeAuthor && { include: [authorInclude()] }),
    });
  }

  static async searchPosts(
    searchTerm: string,
    options: {
      limit?: number;
      offset?: number;
      visibility?: PostVisibility;
      userId?: number;
    } = {},
  ) {
    const { limit = 20, offset = 0, visibility = "public", userId } = options;

    const whereClause: any = {
      content: { [Op.iLike]: `%${searchTerm}%` },
    };
    if (visibility) whereClause.visibility = visibility;
    if (userId) whereClause.userId = userId;

    return this.findAll({
      where: whereClause,
      include: [authorInclude()],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  }

  static async getPostStats(userId: number) {
    const [totalCount, publicCount, friendsCount, privateCount] =
      await Promise.all([
        this.count({ where: { userId } }),
        this.count({ where: { userId, visibility: "public" } }),
        this.count({ where: { userId, visibility: "friends" } }),
        this.count({ where: { userId, visibility: "private" } }),
      ]);

    return { totalCount, publicCount, friendsCount, privateCount };
  }
}
