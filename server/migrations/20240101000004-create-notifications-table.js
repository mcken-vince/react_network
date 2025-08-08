'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      type: {
        type: Sequelize.ENUM('connection_request', 'connection_accepted', 'connection_rejected'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      related_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      connection_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'connections',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('notifications', ['user_id'], {
      name: 'idx_notifications_user'
    });

    await queryInterface.addIndex('notifications', ['type'], {
      name: 'idx_notifications_type'
    });

    await queryInterface.addIndex('notifications', ['is_read'], {
      name: 'idx_notifications_read'
    });

    await queryInterface.addIndex('notifications', ['created_at'], {
      name: 'idx_notifications_created_at'
    });

    // Create the update trigger
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_notifications_updated_at
      BEFORE UPDATE ON notifications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
  },

  down: async (queryInterface, _Sequelize) => {
    // Drop the trigger
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
    `);

    // Drop indexes
    await queryInterface.removeIndex('notifications', 'idx_notifications_user');
    await queryInterface.removeIndex('notifications', 'idx_notifications_type');
    await queryInterface.removeIndex('notifications', 'idx_notifications_read');
    await queryInterface.removeIndex('notifications', 'idx_notifications_created_at');

    // Drop the table
    await queryInterface.dropTable('notifications');
  }
};
