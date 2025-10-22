import "reflect-metadata";
import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
import config from "../config/database";

// Import models
import User from "./User.model";
import Connection from "./Connection.model";
import Notification from "./Notification.model";
import Conversation from "./Conversation.model";
import ConversationParticipant from "./ConversationParticipant.model";
import Message from "./Message.model";
import Post from "./Post.model";

dotenv.config();

const env = (process.env.NODE_ENV || "development") as keyof typeof config;

// Initialize Sequelize with sequelize-typescript
const sequelize = new Sequelize({
  ...config[env],
  models: [
    User,
    Connection,
    Notification,
    Conversation,
    ConversationParticipant,
    Message,
    Post,
  ],
  logging: env === "development" ? console.log : false,
});

// ============================================================================
// Database utility functions
// ============================================================================

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
}

/**
 * Sync all models with database
 * WARNING: Use { force: true } only in development - it will drop existing tables
 */
async function syncDatabase(
  options: { force?: boolean; alter?: boolean } = {}
) {
  try {
    await sequelize.sync(options);
    console.log("Database synced successfully.");
    return true;
  } catch (error) {
    console.error("Error syncing database:", error);
    return false;
  }
}

/**
 * Close database connection
 */
async function closeConnection() {
  try {
    await sequelize.close();
    console.log("Database connection closed.");
    return true;
  } catch (error) {
    console.error("Error closing database connection:", error);
    return false;
  }
}

/**
 * Check if database is ready for operations
 */
async function isDatabaseReady(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    // Check if essential tables exist
    const tableNames = ["users", "connections", "notifications"];
    for (const tableName of tableNames) {
      const [results] = await sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        );`
      );
      if (!(results as any)[0]?.exists) {
        return false;
      }
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize database with proper error handling
 */
async function initializeDatabase(
  options: { force?: boolean; alter?: boolean } = {}
) {
  try {
    console.log("Initializing database connection...");
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error("Failed to establish database connection");
    }

    console.log("Syncing database models...");
    const isSynced = await syncDatabase(options);
    if (!isSynced) {
      throw new Error("Failed to sync database models");
    }

    console.log("Database initialized successfully!");
    return true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    return false;
  }
}

// Export everything
export {
  sequelize,
  User,
  Connection,
  Notification,
  Conversation,
  ConversationParticipant,
  Message,
  Post,
  testConnection,
  syncDatabase,
  closeConnection,
  isDatabaseReady,
  initializeDatabase,
};

export { BaseModel } from "./BaseModel";
export { BaseUuidModel } from "./BaseUuidModel";
