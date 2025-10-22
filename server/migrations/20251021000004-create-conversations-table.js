'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('direct', 'group'),
        allowNull: false,
        defaultValue: 'direct'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      lastMessageAt: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('conversations', ['type'], {
      name: 'idx_conversations_type'
    });

    await queryInterface.addIndex('conversations', ['createdBy'], {
      name: 'idx_conversations_creator'
    });

    await queryInterface.addIndex('conversations', ['lastMessageAt'], {
      name: 'idx_conversations_last_message'
    });

    await queryInterface.addIndex('conversations', ['createdAt'], {
      name: 'idx_conversations_created_at'
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('conversations');
  }
};
