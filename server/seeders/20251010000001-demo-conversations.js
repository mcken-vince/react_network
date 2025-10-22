'use strict';

import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface, Sequelize) => {
    // Get existing users
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users ORDER BY id LIMIT 5',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length < 2) {
      console.log('Not enough users to create conversations');
      return;
    }

    const now = new Date();
    const conversations = [];
    const conversationIds = [];

    // Create 2 direct conversations
    for (let i = 0; i < Math.min(2, users.length - 1); i++) {
      const conversationId = uuidv4();
      conversationIds.push({
        id: conversationId,
        type: 'direct',
        participants: [users[i].id, users[i + 1].id]
      });

      conversations.push({
        id: conversationId,
        type: 'direct',
        name: null,
        createdBy: users[i].id,
        createdAt: new Date(now.getTime() - (2 - i) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - (2 - i) * 60 * 60 * 1000)
      });
    }

    // Create 1 group conversation if we have enough users
    if (users.length >= 3) {
      const groupId = uuidv4();
      conversationIds.push({
        id: groupId,
        type: 'group',
        participants: users.slice(0, 3).map(u => u.id)
      });

      conversations.push({
        id: groupId,
        type: 'group',
        name: 'Team Discussion',
        createdBy: users[0].id,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 30 * 60 * 1000)
      });
    }

    // Insert conversations
    await queryInterface.bulkInsert('conversations', conversations);

    // Create participants
    const participants = [];
    conversationIds.forEach((conv, convIndex) => {
      conv.participants.forEach((userId, userIndex) => {
        participants.push({
          id: uuidv4(),
          conversationId: conv.id,
          userId: userId,
          joinedAt: new Date(now.getTime() - (3 - convIndex) * 24 * 60 * 60 * 1000),
          lastReadAt: userIndex === 0 ? new Date(now.getTime() - 60 * 60 * 1000) : null,
          isAdmin: conv.type === 'group' && userIndex === 0,
          isActive: true,
          createdAt: new Date(now.getTime() - (3 - convIndex) * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - (3 - convIndex) * 24 * 60 * 60 * 1000)
        });
      });
    });

    await queryInterface.bulkInsert('conversationParticipants', participants);

    console.log(`Created ${conversations.length} conversations with ${participants.length} participants`);
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.bulkDelete('conversationParticipants', null, {});
    await queryInterface.bulkDelete('conversations', null, {});
  }
};
