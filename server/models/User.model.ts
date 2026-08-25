import {
  Table,
  Column,
  DataType,
  Unique,
  AllowNull,
  BeforeCreate,
  BeforeUpdate,
  HasMany,
  Scopes,
  DefaultScope,
} from "sequelize-typescript";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import { BaseModel } from "./BaseModel";
import Connection from "./Connection.model";
import Notification from "./Notification.model";
import Conversation from "./Conversation.model";
import ConversationParticipant from "./ConversationParticipant.model";
import Message from "./Message.model";
import Post from "./Post.model";
import { UserAttributes } from "./types";

@DefaultScope(() => ({
  attributes: { exclude: ["password"] },
}))
@Scopes(() => ({
  withPassword: {
    // Include password in results
  },
  public: {
    attributes: [
      "id",
      "firstName",
      "lastName",
      "username",
      "location",
      "bio",
      "createdAt",
    ],
  },
  minimal: {
    attributes: ["id", "firstName", "lastName", "username"],
  },
  active: {
    where: {
      // Add any active user conditions here if needed
    },
  },
}))
@Table({
  tableName: "users",
  timestamps: true,
  indexes: [
    {
      fields: ["username"],
      unique: true,
    },
    {
      fields: ["email"],
      unique: true,
      where: {
        email: {
          [Op.ne]: null,
        },
      },
    },
    {
      fields: ["createdAt"],
    },
  ],
})
export default class User extends BaseModel<UserAttributes> {
  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: {
        msg: "First name is required",
      },
    },
  })
  firstName!: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: {
        msg: "Last name is required",
      },
    },
  })
  lastName!: string;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    validate: {
      min: {
        args: [1] as const,
        msg: "Age must be greater than 0",
      },
      isInt: {
        msg: "Age must be a valid integer",
      },
    },
  })
  age!: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: {
        msg: "Location is required",
      },
    },
  })
  location!: string;

  @AllowNull(false)
  @Unique({
    name: "unique_username",
    msg: "Username already exists",
  })
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: {
        msg: "Username is required",
      },
      len: {
        args: [3, 30],
        msg: "Username must be between 3 and 30 characters",
      },
    },
  })
  username!: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: {
        msg: "Password is required",
      },
      len: {
        args: [6, 100] as const,
        msg: "Password must be at least 6 characters long",
      },
    },
  })
  password!: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    validate: {
      isEmail: {
        msg: "Must be a valid email address",
      },
    },
  })
  email?: string;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    validate: {
      len: {
        args: [0, 500],
        msg: "Bio must be less than 500 characters",
      },
    },
  })
  bio?: string;

  // Associations
  @HasMany(() => Connection, {
    foreignKey: "requesterId",
    as: "sentRequests",
  })
  sentRequests!: Connection[];

  @HasMany(() => Connection, {
    foreignKey: "recipientId",
    as: "receivedRequests",
  })
  receivedRequests!: Connection[];

  @HasMany(() => Notification, {
    foreignKey: "userId",
    as: "notifications",
  })
  notifications!: Notification[];

  @HasMany(() => Notification, {
    foreignKey: "relatedUserId",
    as: "relatedNotifications",
  })
  relatedNotifications!: Notification[];

  @HasMany(() => Conversation, {
    foreignKey: "createdBy",
    as: "createdConversations",
  })
  createdConversations!: Conversation[];

  @HasMany(() => ConversationParticipant, {
    foreignKey: "userId",
    as: "participantConversations",
  })
  participantConversations!: ConversationParticipant[];

  @HasMany(() => Message, {
    foreignKey: "senderId",
    as: "sentMessages",
  })
  sentMessages!: Message[];

  @HasMany(() => Post, {
    foreignKey: "userId",
    as: "posts",
  })
  posts!: Post[];

  // Hooks
  @BeforeCreate
  static async hashPasswordBeforeCreate(user: User) {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 12);
    }
  }

  @BeforeUpdate
  static async hashPasswordBeforeUpdate(user: User) {
    if (user.changed("password")) {
      user.password = await bcrypt.hash(user.password, 12);
    }
  }

  // Instance methods
  async comparePassword(candidatePassword: string): Promise<boolean> {
    // Default scope strips the password; reload it if it wasn't selected.
    let hash: string | undefined = this.getDataValue("password");
    if (!hash) {
      const withPassword = await User.scope("withPassword").findByPk(this.id);
      hash = withPassword?.getDataValue("password");
    }
    if (!hash) {
      throw new Error("User password not found");
    }
    return bcrypt.compare(candidatePassword, hash);
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isProfileComplete(): boolean {
    return !!(
      this.firstName &&
      this.lastName &&
      this.username &&
      this.email &&
      this.location
    );
  }

  override toJSON() {
    const values = super.toJSON();
    delete values.password;
    // Add computed fields
    values.fullName = this.getFullName();
    values.isProfileComplete = this.isProfileComplete();
    return values;
  }

  // Static methods
  static async findByUsername(username: string) {
    try {
      return await this.scope("withPassword").findOne({ where: { username } });
    } catch (error) {
      throw new Error(`Failed to find user by username: ${error}`);
    }
  }

  static async findByEmail(email: string) {
    try {
      return await this.scope("withPassword").findOne({ where: { email } });
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error}`);
    }
  }

  static async findById(id: number) {
    try {
      return await this.findByPk(id);
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error}`);
    }
  }

  static async createUser(
    userData: Partial<UserAttributes>,
    transaction?: any,
  ) {
    try {
      // Validate required fields
      const requiredFields = [
        "username",
        "password",
        "firstName",
        "lastName",
        "age",
        "location",
      ];
      for (const field of requiredFields) {
        if (!userData[field as keyof UserAttributes]) {
          throw new Error(`Required field missing: ${field}`);
        }
      }

      return await this.create(userData as UserAttributes, { transaction });
    } catch (error) {
      if (error instanceof Error) {
        // Handle unique constraint violations
        if (error.message.includes("username")) {
          throw new Error("Username already exists");
        }
        if (error.message.includes("email")) {
          throw new Error("Email already exists");
        }
      }
      throw error;
    }
  }

  static async getAllUsers(options: { limit?: number; offset?: number } = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      return await this.scope("public").findAll({
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });
    } catch (error) {
      throw new Error(`Failed to get users: ${error}`);
    }
  }

  static async updateUser(
    id: number,
    userData: Partial<UserAttributes>,
    transaction?: any,
  ) {
    try {
      const user = await this.findByPk(id);
      if (!user) {
        return null;
      }

      delete userData.password; // Prevent password updates here

      return await user.update(userData, { transaction });
    } catch (error) {
      if (error instanceof Error) {
        // Handle unique constraint violations
        if (error.message.includes("username")) {
          throw new Error("Username already exists");
        }
        if (error.message.includes("email")) {
          throw new Error("Email already exists");
        }
      }
      throw error;
    }
  }

  static async searchUsers(
    searchTerm: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    try {
      const { limit = 20, offset = 0 } = options;
      return await this.scope("public").findAll({
        where: {
          [Op.or]: [
            { username: { [Op.iLike]: `%${searchTerm}%` } },
            { firstName: { [Op.iLike]: `%${searchTerm}%` } },
            { lastName: { [Op.iLike]: `%${searchTerm}%` } },
            { location: { [Op.iLike]: `%${searchTerm}%` } },
          ],
        },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });
    } catch (error) {
      throw new Error(`Failed to search users: ${error}`);
    }
  }
}
