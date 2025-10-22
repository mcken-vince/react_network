'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('conversationParticipants', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      conversationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      role: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      isAdmin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      lastReadAt: {
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
    await queryInterface.addIndex('conversationParticipants', ['conversationId', 'userId'], {
      unique: true,
      name: 'unique_conversation_participant'
    });

    await queryInterface.addIndex('conversationParticipants', ['conversationId'], {
      name: 'idx_participants_conversation'
    });

    await queryInterface.addIndex('conversationParticipants', ['userId'], {
      name: 'idx_participants_user'
    });

    await queryInterface.addIndex('conversationParticipants', ['isActive'], {
      name: 'idx_participants_active'
    });

    await queryInterface.addIndex('conversationParticipants', ['lastReadAt'], {
      name: 'idx_participants_last_read'
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('conversationParticipants');
  }
};
