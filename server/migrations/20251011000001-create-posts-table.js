import { DataTypes } from 'sequelize';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('posts', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      image_url: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      visibility: {
        type: DataTypes.ENUM('public', 'friends', 'private'),
        allowNull: false,
        defaultValue: 'friends'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('posts', ['user_id'], {
      name: 'posts_user_id_idx'
    });

    await queryInterface.addIndex('posts', ['user_id', 'created_at'], {
      name: 'posts_user_id_created_at_idx'
    });

    await queryInterface.addIndex('posts', ['created_at'], {
      name: 'posts_created_at_idx'
    });

    await queryInterface.addIndex('posts', ['visibility'], {
      name: 'posts_visibility_idx'
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('posts');
  }
};
