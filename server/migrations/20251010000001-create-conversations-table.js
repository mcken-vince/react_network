'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('direct', 'group'),
        allowNull: false,
        defaultValue: 'direct'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Name for group conversations'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who created the conversation (mainly for groups)'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('conversations', ['type'], {
      name: 'idx_conversations_type'
    });

    await queryInterface.addIndex('conversations', ['created_by'], {
      name: 'idx_conversations_created_by'
    });

    await queryInterface.addIndex('conversations', ['updated_at'], {
      name: 'idx_conversations_updated_at'
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('conversations');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_conversations_type";');
  }
};
