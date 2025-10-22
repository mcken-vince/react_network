'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('connections', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      requesterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      recipientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
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
    await queryInterface.addIndex('connections', ['requesterId'], {
      name: 'idx_connections_requester'
    });

    await queryInterface.addIndex('connections', ['recipientId'], {
      name: 'idx_connections_recipient'
    });

    await queryInterface.addIndex('connections', ['status'], {
      name: 'idx_connections_status'
    });

    await queryInterface.addIndex('connections', ['createdAt'], {
      name: 'idx_connections_created_at'
    });

    await queryInterface.addIndex('connections', ['requesterId', 'recipientId'], {
      unique: true,
      name: 'unique_connection_pair'
    });

    await queryInterface.addIndex('connections', ['recipientId', 'requesterId'], {
      name: 'idx_connections_reverse'
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('connections');
  }
};
