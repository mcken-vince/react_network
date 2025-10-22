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
import { PostAttributes } from "./types";

@Scopes(() => ({
  public: {
    where: { visibility: "public" },
  },
  friends: {
    where: { visibility: "friends" },
  },
  private: {
    where: { visibility: "private" },
  },
  withAuthor: {
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "firstName", "lastName", "username", "location"],
      },
    ],
  },
  recent: {
    order: [["createdAt", "DESC"]],
    limit: 10,
  },
}))
@Table({
  tableName: "posts",
  timestamps: true,
  indexes: [
    {
      fields: ["userId"],
      name: "idx_posts_user",
    },
    {
      fields: ["visibility"],
      name: "idx_posts_visibility",
    },
    {
      fields: ["createdAt"],
      name: "idx_posts_created_at",
    },
    {
      fields: ["userId", "createdAt"],
      name: "idx_posts_user_timeline",
    },
    {
      fields: ["visibility", "createdAt"],
      name: "idx_posts_feed",
    },
  ],
})
export default class Post extends BaseUuidModel<PostAttributes> {

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    onDelete: "CASCADE",
  })
  userId!: number;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    validate: {
      notEmpty: {
        msg: "Post content cannot be empty",
      },
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
    validate: {
      isUrl: {
        msg: "Image URL must be a valid URL",
      },
    },
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
  visibility!: "public" | "friends" | "private";

  // Associations
  @BelongsTo(() => User, {
    foreignKey: "userId",
    as: "author",
  })
  author!: User;

  // Static methods
  static async createPost(
    postData: Partial<PostAttributes>,
    transaction?: any
  ) {
    return this.create(postData as PostAttributes, { transaction });
  }

  static async findPostById(postId: string, options: any = {}) {
    return this.findByPk(postId, options);
  }

  static async updatePost(
    postId: string,
    updateData: Partial<PostAttributes>,
    transaction?: any
  ) {
    const post = await this.findByPk(postId);
    if (!post) {
      return null;
    }
    return post.update(updateData, { transaction });
  }

  static async deletePost(postId: string, transaction?: any) {
    const post = await this.findByPk(postId);
    if (!post) {
      return null;
    }
    await post.destroy({ transaction });
    return post;
  }

  static async getUserPosts(
    userId: number,
    options: {
      limit?: number;
      offset?: number;
      order?: any;
      includeAuthor?: boolean;
    } = {}
  ) {
    const {
      limit = 50,
      offset = 0,
      order = [["createdAt", "DESC"]],
      includeAuthor = false,
    } = options;

    const queryOptions: any = {
      where: { userId },
      limit,
      offset,
      order,
    };

    if (includeAuthor) {
      queryOptions.include = [
        {
          model: User,
          as: "author",
          attributes: ["id", "firstName", "lastName", "username", "location"],
        },
      ];
    }

    return this.findAll(queryOptions);
  }

  static async getFeedPosts(
    userIds: number[],
    options: {
      limit?: number;
      offset?: number;
      order?: any;
      includeAuthor?: boolean;
    } = {}
  ) {
    const {
      limit = 50,
      offset = 0,
      order = [["createdAt", "DESC"]],
      includeAuthor = true,
    } = options;

    const queryOptions: any = {
      where: {
        userId: userIds,
        visibility: ["friends", "public"],
      },
      limit,
      offset,
      order,
    };

    if (includeAuthor) {
      queryOptions.include = [
        {
          model: User,
          as: "author",
          attributes: ["id", "firstName", "lastName", "username", "location"],
        },
      ];
    }

    return this.findAll(queryOptions);
  }

  static async canUserAccessPost(postId: string, userId: number) {
    const post = await this.findByPk(postId);
    if (!post) {
      return false;
    }
    return post.userId === userId || post.visibility === "public";
  }

  static async getPublicPosts(options: {
    limit?: number;
    offset?: number;
    includeAuthor?: boolean;
  } = {}) {
    const {
      limit = 50,
      offset = 0,
      includeAuthor = true,
    } = options;

    const queryOptions: any = {
      where: { visibility: "public" },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    };

    if (includeAuthor) {
      queryOptions.include = [
        {
          model: User,
          as: "author",
          attributes: ["id", "firstName", "lastName", "username", "location"],
        },
      ];
    }

    return this.findAll(queryOptions);
  }

  static async searchPosts(
    searchTerm: string,
    options: {
      limit?: number;
      offset?: number;
      visibility?: "public" | "friends" | "private";
      userId?: number;
    } = {}
  ) {
    const {
      limit = 20,
      offset = 0,
      visibility = "public",
      userId,
    } = options;

    const whereClause: any = {
      content: { [Op.iLike]: `%${searchTerm}%` },
    };

    if (visibility) {
      whereClause.visibility = visibility;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    return this.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "firstName", "lastName", "username", "location"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  }

  static async getPostStats(userId: number) {
    const [totalCount, publicCount, friendsCount, privateCount] = await Promise.all([
      this.count({ where: { userId } }),
      this.count({ where: { userId, visibility: "public" } }),
      this.count({ where: { userId, visibility: "friends" } }),
      this.count({ where: { userId, visibility: "private" } }),
    ]);

    return {
      totalCount,
      publicCount,
      friendsCount,
      privateCount,
    };
  }
}
