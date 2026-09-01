import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  UpdatedAt,
} from "sequelize-typescript";

/** Base for tables with an auto-incrementing integer primary key. */
export abstract class BaseModel<
  TAttrs extends object,
  TCreate extends object = TAttrs,
> extends Model<TAttrs, TCreate> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
