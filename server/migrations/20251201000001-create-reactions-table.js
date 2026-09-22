'use strict';
export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reactions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      // No FK on targetId: it points at posts, postComments, or messages
      // depending on targetType (all UUID). Cleanup is done by model hooks.
      targetType: { type: Sequelize.STRING(20), allowNull: false },
      targetId: { type: Sequelize.UUID, allowNull: false },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // Validated STRING (not ENUM) so new reaction types need no migration.
      type: { type: Sequelize.STRING(20), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Never the same reaction twice. The single-reaction policy is enforced
    // in application code (per feature), not by this index.
    await queryInterface.addIndex('reactions', ['targetType', 'targetId', 'userId', 'type'], {
      unique: true,
      name: 'unique_reaction'
    });
    await queryInterface.addIndex('reactions', ['targetType', 'targetId'], { name: 'idx_reactions_target' });
    await queryInterface.addIndex('reactions', ['userId'], { name: 'idx_reactions_user' });
    await queryInterface.sequelize.query(
      `ALTER TABLE reactions ADD CONSTRAINT reactions_target_type_check
       CHECK ("targetType" IN ('post', 'comment', 'message'))`
    );
  },
  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('reactions');
  }
};