import { sequelize } from "../models";

const dropDatabase = async () => {
  try {
    console.log(
      "⚠️  WARNING: This will drop ALL tables, types, and migration history!",
    );
    console.log("Proceeding in 3 seconds... Press Ctrl+C to cancel.");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Drop everything in the public schema:
    // - all tables (including SequelizeMeta)
    // - all ENUM types created by migrations
    // This avoids relying on migration down() scripts, which fail if a
    // recorded migration file has been deleted from the repo.
    await sequelize.query("DROP SCHEMA public CASCADE;");
    await sequelize.query("CREATE SCHEMA public;");

    console.log("✅ Database dropped successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error dropping database:", error);
    process.exit(1);
  }
};

dropDatabase();
