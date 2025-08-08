'use strict';

export default {
  up: async (queryInterface, _Sequelize) => {
    // Get user and connection IDs for creating sample notifications
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users ORDER BY id LIMIT 5`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const connections = await queryInterface.sequelize.query(
      `SELECT id, requester_id, recipient_id FROM connections LIMIT 3`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length < 3 || connections.length < 1) {
      console.log('Not enough users or connections to create notifications. Run previous seeders first.');
      return;
    }

    const notifications = [
      {
        user_id: users[0].id, // John gets a notification
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${users[1].username} wants to connect with you.`,
        related_user_id: users[1].id,
        connection_id: connections[0].id,
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        updated_at: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        user_id: users[1].id, // Jane gets a notification
        type: 'connection_accepted',
        title: 'Connection Request Accepted',
        message: `${users[0].username} accepted your connection request.`,
        related_user_id: users[0].id,
        connection_id: connections[0].id,
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        user_id: users[2].id, // Bob gets a notification
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${users[3].username} wants to connect with you.`,
        related_user_id: users[3].id,
        connection_id: connections[1]?.id || connections[0].id,
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
        updated_at: new Date(Date.now() - 1000 * 60 * 10)
      }
    ];

    await queryInterface.bulkInsert('notifications', notifications, {});
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.bulkDelete('notifications', null, {});
  }
};
