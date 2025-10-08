'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('conversation_participants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      last_read_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp of last read message for read receipts'
      },
      is_admin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Admin status for group conversations'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Soft leave functionality - false means user left conversation'
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

    // Add unique constraint to prevent duplicate participants
    await queryInterface.addConstraint('conversation_participants', {
      fields: ['conversation_id', 'user_id'],
      type: 'unique',
      name: 'unique_conversation_participant'
    });

    // Add indexes for performance
    await queryInterface.addIndex('conversation_participants', ['conversation_id'], {
      name: 'idx_conversation_participants_conversation_id'
    });

    await queryInterface.addIndex('conversation_participants', ['user_id', 'is_active'], {
      name: 'idx_conversation_participants_user_active'
    });

    await queryInterface.addIndex('conversation_participants', ['user_id', 'conversation_id'], {
      name: 'idx_conversation_participants_lookup'
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('conversation_participants');
  }
};
