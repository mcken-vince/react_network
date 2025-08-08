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
      requester_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
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

    // Create unique constraint
    await queryInterface.addConstraint('connections', {
      fields: ['requester_id', 'recipient_id'],
      type: 'unique',
      name: 'unique_requester_recipient'
    });

    // Create indexes
    await queryInterface.addIndex('connections', ['requester_id'], {
      name: 'idx_connections_requester'
    });

    await queryInterface.addIndex('connections', ['recipient_id'], {
      name: 'idx_connections_recipient'
    });

    await queryInterface.addIndex('connections', ['status'], {
      name: 'idx_connections_status'
    });

    // Create the update trigger
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_connections_updated_at
      BEFORE UPDATE ON connections
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // Add check constraint to prevent self-connections
    await queryInterface.sequelize.query(`
      ALTER TABLE connections
      ADD CONSTRAINT check_not_self_connection
      CHECK (requester_id != recipient_id);
    `);
  },

  down: async (queryInterface, _Sequelize) => {
    // Drop the trigger
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_connections_updated_at ON connections;
    `);

    // Drop the check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE connections
      DROP CONSTRAINT IF EXISTS check_not_self_connection;
    `);

    // Drop indexes
    await queryInterface.removeIndex('connections', 'idx_connections_requester');
    await queryInterface.removeIndex('connections', 'idx_connections_recipient');
    await queryInterface.removeIndex('connections', 'idx_connections_status');

    // Drop the table
    await queryInterface.dropTable('connections');
  }
};
