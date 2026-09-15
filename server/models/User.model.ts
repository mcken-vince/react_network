import {
  AllowNull,
  BeforeCreate,
  BeforeUpdate,
  Column,
  DataType,
  DefaultScope,
  HasMany,
  Scopes,
  Table,
} from "sequelize-typescript";
import { Op, UniqueConstraintError } from "sequelize";
import bcrypt from "bcryptjs";
import { BaseModel } from "./BaseModel";
import Connection from "./Connection.model";
import Notification from "./Notification.model";
import Conversation from "./Conversation.model";
import ConversationParticipant from "./ConversationParticipant.model";
import Message from "./Message.model";
import Post from "./Post.model";
import { ConflictError, NotFoundError } from "../lib/errors";
import { LIMITS } from "../../shared/limits";
import type { UserAttributes, UserCreationAttributes } from "./types";

const BCRYPT_ROUNDS = 12;

const PUBLIC_ATTRIBUTES = [
  "id",
  "firstName",
  "lastName",
  "username",
  "age",
  "location",
  "bio",
  "createdAt",
  "updatedAt",
];

/** What a User serializes to (never includes the password hash). */
export type PublicUser = Omit<UserAttributes, "password"> & {
  fullName: string;
  isProfileComplete: boolean;
};

/** Postgres reports the violated column in `errors[].path`. */
function translateUniqueError(error: unknown): unknown {
  if (error instanceof UniqueConstraintError) {
    const field = error.errors[0]?.path ?? "";
    if (field.includes("username"))
      return new ConflictError("Username already exists");
    if (field.includes("email"))
      return new ConflictError("Email already exists");
  }
  return error;
}

@DefaultScope(() => ({
  attributes: { exclude: ["password"] },
}))
@Scopes(() => ({
  // An empty scope *replaces* the default scope, so the password is selected.
  withPassword: {},
  public: { attributes: PUBLIC_ATTRIBUTES },
}))
@Table({
  tableName: "users",
  timestamps: true,
  indexes: [
    { fields: ["username"], unique: true, name: "users_username_unique" },
    {
      fields: ["email"],
      unique: true,
      name: "users_email_unique",
      where: { email: { [Op.ne]: null } },
    },
    { fields: ["createdAt"], name: "users_createdAt_idx" },
  ],
})
export default class User extends BaseModel<
  UserAttributes,
  UserCreationAttributes
> {
  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: { notEmpty: { msg: "First name is required" } },
  })
  firstName!: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: { notEmpty: { msg: "Last name is required" } },
  })
  lastName!: string;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    validate: {
      isInt: { msg: "Age must be a valid integer" },
      min: {
        args: [LIMITS.AGE_MIN],
        msg: `Age must be at least ${LIMITS.AGE_MIN}`,
      },
      max: {
        args: [LIMITS.AGE_MAX],
        msg: `Age must be at most ${LIMITS.AGE_MAX}`,
      },
    },
  })
  age!: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: { notEmpty: { msg: "Location is required" } },
  })
  location!: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: { msg: "Username is required" },
      len: {
        args: [LIMITS.USERNAME_MIN, LIMITS.USERNAME_MAX],
        msg: `Username must be between ${LIMITS.USERNAME_MIN} and ${LIMITS.USERNAME_MAX} characters`,
      },
    },
  })
  username!: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: { notEmpty: { msg: "Password is required" } },
  })
  password!: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    validate: { isEmail: { msg: "Must be a valid email address" } },
  })
  email!: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    validate: {
      len: {
        args: [0, LIMITS.BIO_MAX],
        msg: `Bio must be less than ${LIMITS.BIO_MAX} characters`,
      },
    },
  })
  bio!: string | null;

  // --------------------------------------------------------------------------
  // Associations
  // --------------------------------------------------------------------------

  @HasMany(() => Connection, { foreignKey: "requesterId", as: "sentRequests" })
  sentRequests!: Connection[];

  @HasMany(() => Connection, {
    foreignKey: "recipientId",
    as: "receivedRequests",
  })
  receivedRequests!: Connection[];

  @HasMany(() => Notification, { foreignKey: "userId", as: "notifications" })
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

  @HasMany(() => Message, { foreignKey: "senderId", as: "sentMessages" })
  sentMessages!: Message[];

  @HasMany(() => Post, { foreignKey: "userId", as: "posts" })
  posts!: Post[];

  // --------------------------------------------------------------------------
  // Hooks
  // --------------------------------------------------------------------------

  @BeforeCreate
  static async hashPasswordBeforeCreate(user: User): Promise<void> {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    }
  }

  @BeforeUpdate
  static async hashPasswordBeforeUpdate(user: User): Promise<void> {
    if (user.changed("password")) {
      user.password = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    }
  }

  // --------------------------------------------------------------------------
  // Instance methods
  // --------------------------------------------------------------------------

  async comparePassword(candidatePassword: string): Promise<boolean> {
    // The default scope strips the hash; reload it if this instance lacks it.
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
    return Boolean(
      this.firstName &&
        this.lastName &&
        this.username &&
        this.email &&
        this.location,
    );
  }

  toPublic(): PublicUser {
    const { password: _password, ...values } = this.get({ plain: true });
    return {
      ...values,
      fullName: this.getFullName(),
      isProfileComplete: this.isProfileComplete(),
    };
  }

  // Sequelize declares `toJSON<T extends Attributes>(): T`; an override must
  // keep that shape, so we delegate to toPublic() and cast.
  override toJSON<T extends UserAttributes>(): T {
    return this.toPublic() as unknown as T;
  }

  // --------------------------------------------------------------------------
  // Static methods
  // --------------------------------------------------------------------------

  /** Includes the password hash — for authentication only. */
  static findByUsername(username: string): Promise<User | null> {
    return this.scope("withPassword").findOne({ where: { username } });
  }

  /** @throws ConflictError on a duplicate username/email */
  static async createUser(data: UserCreationAttributes): Promise<User> {
    try {
      return await this.create(data);
    } catch (error) {
      throw translateUniqueError(error);
    }
  }

  static getAllUsers(
    options: { limit?: number; offset?: number } = {},
  ): Promise<User[]> {
    const { limit = LIMITS.PAGE_LIMIT_DEFAULT, offset = 0 } = options;
    return this.scope("public").findAll({
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  }

  /**
   * Update profile fields. `password` is always stripped — use the instance
   * setter + save() so the BeforeUpdate hook hashes it.
   * @throws NotFoundError, ConflictError
   */
  static async updateUser(
    id: number,
    data: Partial<UserAttributes>,
  ): Promise<User> {
    const user = await this.findByPk(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const { password: _password, ...safeData } = data;
    try {
      return await user.update(safeData);
    } catch (error) {
      throw translateUniqueError(error);
    }
  }

  static searchUsers(
    searchTerm: string,
    options: { limit?: number; offset?: number; excludeUserId?: number } = {},
  ): Promise<User[]> {
    const { limit = 20, offset = 0, excludeUserId } = options;
    const pattern = `%${searchTerm}%`;
    return this.scope("public").findAll({
      where: {
        ...(excludeUserId !== undefined && { id: { [Op.ne]: excludeUserId } }),
        [Op.or]: [
          { username: { [Op.iLike]: pattern } },
          { firstName: { [Op.iLike]: pattern } },
          { lastName: { [Op.iLike]: pattern } },
          { location: { [Op.iLike]: pattern } },
        ],
      },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  }
}
