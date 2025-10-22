import {
  Model,
  Column,
  PrimaryKey,
  AutoIncrement,
  DataType,
} from "sequelize-typescript";

/**
 * Abstract base model for tables with integer primary keys and timestamps
 * All models with auto-incrementing integer IDs should extend this class
 */
export abstract class BaseModel<T = unknown> extends Model<T> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;

  /**
   * Override toJSON to ensure camelCase fields for frontend
   */
  override toJSON(): any {
    const values = { ...this.get() };
    return values;
  }
}
