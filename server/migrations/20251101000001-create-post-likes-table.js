'use strict';
export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('postLikes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
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
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('postLikes', ['postId', 'userId'], { unique: true, name: 'unique_post_like' });
    await queryInterface.addIndex('postLikes', ['postId'], { name: 'idx_post_likes_post' });
    await queryInterface.addIndex('postLikes', ['userId'], { name: 'idx_post_likes_user' });
  },
  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('postLikes');
  }
};