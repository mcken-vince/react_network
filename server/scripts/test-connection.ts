import {
  sequelize,
  User,
  Connection,
  Post,
  Conversation,
  Message,
} from "../models";

async function testConnection(): Promise<void> {
  await sequelize.authenticate();
  console.log("✅ Database connection established");

  const tables = await sequelize.getQueryInterface().showAllTables();
  console.log(`📋 Tables (${tables.length}):`, tables.join(", "));

  const [users, connections, posts, conversations, messages] =
    await Promise.all([
      User.count(),
      Connection.count(),
      Post.count(),
      Conversation.count(),
      Message.count(),
    ]);
  console.log("📈 Rows:", {
    users,
    connections,
    posts,
    conversations,
    messages,
  });
}

testConnection()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error("❌ Database check failed:", error);
    process.exit(1);
  });
