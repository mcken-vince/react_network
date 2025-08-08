'use strict';

export default {
  up: async (queryInterface, _Sequelize) => {
    // Get user IDs
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users ORDER BY id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length < 5) {
      console.log('Not enough users to create connections. Run user seeder first.');
      return;
    }

    const connections = [
      {
        requester_id: users[0].id, // John
        recipient_id: users[1].id, // Jane
        status: 'accepted',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        requester_id: users[0].id, // John
        recipient_id: users[2].id, // Bob
        status: 'accepted',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        requester_id: users[3].id, // Alice
        recipient_id: users[0].id, // John
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        requester_id: users[1].id, // Jane
        recipient_id: users[2].id, // Bob
        status: 'accepted',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        requester_id: users[4].id, // Charlie
        recipient_id: users[0].id, // John
        status: 'rejected',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('connections', connections, {});
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.bulkDelete('connections', null, {});
  }
};
