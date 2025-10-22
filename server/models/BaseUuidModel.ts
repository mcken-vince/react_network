import {
  Model,
  Column,
  PrimaryKey,
  Default,
  DataType,
} from "sequelize-typescript";
import { v4 as uuidv4 } from "uuid";

/**
 * Abstract base model for tables with UUID primary keys and timestamps
 * All models with UUID IDs should extend this class
 */
export abstract class BaseUuidModel<T = unknown> extends Model<T> {
  @PrimaryKey
  @Default(() => uuidv4())
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

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
