'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      relatedUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      relatedEntityType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      relatedEntityId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
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
    await queryInterface.addIndex('notifications', ['userId'], {
      name: 'idx_notifications_user'
    });

    await queryInterface.addIndex('notifications', ['isRead'], {
      name: 'idx_notifications_read_status'
    });

    await queryInterface.addIndex('notifications', ['type'], {
      name: 'idx_notifications_type'
    });

    await queryInterface.addIndex('notifications', ['createdAt'], {
      name: 'idx_notifications_created_at'
    });

    await queryInterface.addIndex('notifications', ['relatedUserId'], {
      name: 'idx_notifications_related_user'
    });

    await queryInterface.addIndex('notifications', ['relatedEntityType', 'relatedEntityId'], {
      name: 'idx_notifications_polymorphic'
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('notifications');
  }
};
