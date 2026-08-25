'use strict';

export default {
  up: async (queryInterface, _Sequelize) => {
    // Get user and connection IDs for creating sample notifications
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users ORDER BY id LIMIT 5`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const connections = await queryInterface.sequelize.query(
      `SELECT id, "requesterId", "recipientId" FROM connections LIMIT 3`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length < 3 || connections.length < 1) {
      console.log('Not enough users or connections to create notifications. Run previous seeders first.');
      return;
    }

    const notifications = [
      {
        userId: users[0].id, // John gets a notification
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${users[1].username} wants to connect with you.`,
        relatedUserId: users[1].id,
        relatedEntityType: 'connection',
        relatedEntityId: connections[0].id,
        isRead: false,
        metadata: JSON.stringify({ actionable: true, category: 'connection' }),
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        userId: users[1].id, // Jane gets a notification
        type: 'connection_accepted',
        title: 'Connection Request Accepted',
        message: `${users[0].username} accepted your connection request.`,
        relatedUserId: users[0].id,
        relatedEntityType: 'connection',
        relatedEntityId: connections[0].id,
        isRead: true,
        metadata: JSON.stringify({ actionable: false, category: 'connection' }),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        userId: users[2].id, // Bob gets a notification
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${users[3].username} wants to connect with you.`,
        relatedUserId: users[3].id,
        relatedEntityType: 'connection',
        relatedEntityId: connections[1]?.id || connections[0].id,
        isRead: false,
        metadata: JSON.stringify({ actionable: true, category: 'connection' }),
        createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 10)
      }
    ];

    await queryInterface.bulkInsert('notifications', notifications, {});
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.bulkDelete('notifications', null, {});
  }
};
