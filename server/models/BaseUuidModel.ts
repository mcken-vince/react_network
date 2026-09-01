import {
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  UpdatedAt,
} from "sequelize-typescript";

/** Base for tables with a UUID primary key. */
export abstract class BaseUuidModel<
  TAttrs extends object,
  TCreate extends object = TAttrs,
> extends Model<TAttrs, TCreate> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
