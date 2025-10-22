'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('posts', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      visibility: {
        type: Sequelize.ENUM('public', 'friends', 'private'),
        allowNull: false,
        defaultValue: 'public'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('posts', ['userId'], {
      name: 'idx_posts_user'
    });

    await queryInterface.addIndex('posts', ['visibility'], {
      name: 'idx_posts_visibility'
    });

    await queryInterface.addIndex('posts', ['createdAt'], {
      name: 'idx_posts_created_at'
    });

    await queryInterface.addIndex('posts', ['userId', 'createdAt'], {
      name: 'idx_posts_user_timeline'
    });

    await queryInterface.addIndex('posts', ['visibility', 'createdAt'], {
      name: 'idx_posts_feed'
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('posts');
  }
};
