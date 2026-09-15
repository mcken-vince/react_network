import "reflect-metadata";
import { Sequelize } from "sequelize-typescript";
import config from "../config/database";
import type { Env } from "../config/database";
import User from "./User.model";
import Connection from "./Connection.model";
import Notification from "./Notification.model";
import Conversation from "./Conversation.model";
import ConversationParticipant from "./ConversationParticipant.model";
import Message from "./Message.model";
import Post from "./Post.model";
import PostLike from "./PostLike.model";
import PostComment from "./PostComment.model";

const envName = process.env.NODE_ENV ?? "development";
const isEnv = (value: string): value is Env => value in config;
if (!isEnv(envName)) {
  throw new Error(
    `Unknown NODE_ENV "${envName}" (expected development|test|production)`,
  );
}

export const sequelize = new Sequelize({
  ...config[envName],
  models: [
    User,
    Connection,
    Notification,
    Conversation,
    ConversationParticipant,
    Message,
    Post,
    PostLike,
    PostComment,
  ],
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
});

export {
  User,
  Connection,
  Notification,
  Conversation,
  ConversationParticipant,
  Message,
  Post,
  PostLike,
  PostComment,
};
