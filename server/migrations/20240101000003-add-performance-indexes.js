'use strict';

export default {
  up: async (queryInterface, _Sequelize) => {
    // Add composite index for connection queries
    await queryInterface.addIndex('connections', ['requester_id', 'status'], {
      name: 'idx_connections_requester_status'
    });

    await queryInterface.addIndex('connections', ['recipient_id', 'status'], {
      name: 'idx_connections_recipient_status'
    });

    // Add index for user search by location
    await queryInterface.addIndex('users', ['location'], {
      name: 'idx_users_location'
    });

    // Add index for user search by age
    await queryInterface.addIndex('users', ['age'], {
      name: 'idx_users_age'
    });

    // Add composite index for user listing queries
    await queryInterface.addIndex('users', ['created_at', 'id'], {
      name: 'idx_users_created_at_id'
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.removeIndex('connections', 'idx_connections_requester_status');
    await queryInterface.removeIndex('connections', 'idx_connections_recipient_status');
    await queryInterface.removeIndex('users', 'idx_users_location');
    await queryInterface.removeIndex('users', 'idx_users_age');
    await queryInterface.removeIndex('users', 'idx_users_created_at_id');
  }
};
