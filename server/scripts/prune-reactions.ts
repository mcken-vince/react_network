import { QueryTypes } from "sequelize";
import { sequelize } from "../models";
import type { ReactionTargetType } from "../../shared/reactions";

/** Reactions whose target no longer exists (soft-deleted messages count as gone). */
const ORPHANS: Record<ReactionTargetType, string> = {
  post: `
    DELETE FROM reactions r
    WHERE r."targetType" = 'post'
      AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = r."targetId")
    RETURNING r.id`,
  comment: `
    DELETE FROM reactions r
    WHERE r."targetType" = 'comment'
      AND NOT EXISTS (SELECT 1 FROM "postComments" c WHERE c.id = r."targetId")
    RETURNING r.id`,
  message: `
    DELETE FROM reactions r
    WHERE r."targetType" = 'message'
      AND NOT EXISTS (
        SELECT 1 FROM messages m
        WHERE m.id = r."targetId" AND m."deletedAt" IS NULL
      )
    RETURNING r.id`,
};

async function prune(): Promise<void> {
  await sequelize.authenticate();
  for (const [targetType, sql] of Object.entries(ORPHANS)) {
    const rows = await sequelize.query<{ id: number }>(sql, {
      type: QueryTypes.SELECT,
    });
    console.log(`🧹 ${targetType}: removed ${rows.length} orphaned reactions`);
  }
}

prune()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error("❌ Prune failed:", error);
    process.exit(1);
  });
