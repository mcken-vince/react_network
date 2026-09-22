'use strict';
// postLikes is left in place; it is dropped in a later migration once this
// backfill has been verified in every environment.
export default {
  up: async (queryInterface, _Sequelize) => {
    await queryInterface.sequelize.query(`
      INSERT INTO reactions ("targetType", "targetId", "userId", "type", "createdAt", "updatedAt")
      SELECT 'post', "postId", "userId", 'like', "createdAt", "updatedAt"
      FROM "postLikes"
      ON CONFLICT ("targetType", "targetId", "userId", "type") DO NOTHING
    `);
  },
  down: async (queryInterface, _Sequelize) => {
    await queryInterface.sequelize.query(`
      DELETE FROM reactions r
      USING "postLikes" pl
      WHERE r."targetType" = 'post'
        AND r."type" = 'like'
        AND r."targetId" = pl."postId"
        AND r."userId" = pl."userId"
    `);
  }
};