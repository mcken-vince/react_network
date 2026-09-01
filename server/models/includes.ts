import type { IncludeOptions } from "sequelize";
import User from "./User.model";

/** Columns exposed when a user is embedded in another entity (author, sender, ...). */
export const USER_SUMMARY_ATTRIBUTES = [
  "id",
  "firstName",
  "lastName",
  "username",
  "location",
] as const;

export const includeUser = (as: string): IncludeOptions => ({
  model: User,
  as,
  attributes: [...USER_SUMMARY_ATTRIBUTES],
  required: false,
});
