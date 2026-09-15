'use strict';
export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('postComments', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4, allowNull: false },
      postId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'posts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('postComments', ['postId'], { name: 'idx_post_comments_post' });
    await queryInterface.addIndex('postComments', ['userId'], { name: 'idx_post_comments_user' });
    await queryInterface.addIndex('postComments', ['postId', 'createdAt'], { name: 'idx_post_comments_timeline' });
  },
  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('postComments');
  }
};