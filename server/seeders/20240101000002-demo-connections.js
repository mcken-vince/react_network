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
        requesterId: users[0].id, // John
        recipientId: users[1].id, // Jane
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        requesterId: users[0].id, // John
        recipientId: users[2].id, // Bob
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        requesterId: users[3].id, // Alice
        recipientId: users[0].id, // John
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        requesterId: users[1].id, // Jane
        recipientId: users[2].id, // Bob
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        requesterId: users[4].id, // Charlie
        recipientId: users[0].id, // John
        status: 'rejected',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('connections', connections, {});
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.bulkDelete('connections', null, {});
  }
};
