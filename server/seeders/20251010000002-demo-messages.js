'use strict';

import { randomUUID } from 'node:crypto';

export default {
  up: async (queryInterface, Sequelize) => {
    // Get existing conversations and their participants
    const conversations = await queryInterface.sequelize.query(
      `SELECT c.id, c.type, cp."userId"
       FROM conversations c
       JOIN "conversationParticipants" cp ON c.id = cp."conversationId"
       WHERE cp."isActive" = true
       ORDER BY c."createdAt", cp."userId"`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (conversations.length === 0) {
      console.log('No conversations found to create messages');
      return;
    }

    // Group participants by conversation
    const conversationMap = {};
    conversations.forEach(conv => {
      if (!conversationMap[conv.id]) {
        conversationMap[conv.id] = {
          type: conv.type,
          participants: []
        };
      }
      conversationMap[conv.id].participants.push(conv.userId);
    });

    const now = new Date();
    const messages = [];
    const messageContents = [
      'Hey! How are you doing?',
      'I\'m doing great, thanks for asking!',
      'Did you see the latest updates?',
      'Yes! They look amazing.',
      'We should catch up soon.',
      'Absolutely! How about next week?',
      'Sounds perfect to me!',
      'Great, I\'ll send you the details.',
      'Looking forward to it!',
      'Same here! 😊'
    ];

    let messageIndex = 0;

    // Create messages for each conversation
    Object.entries(conversationMap).forEach(([conversationId, data], convIndex) => {
      const { participants } = data;
      const messageCount = Math.min(5 + convIndex * 2, 10);

      for (let i = 0; i < messageCount && messageIndex < messageContents.length; i++) {
        const senderId = participants[i % participants.length];
        const minutesAgo = (messageCount - i) * 30 + convIndex * 60;

        messages.push({
          id: randomUUID(),
          conversationId,
          senderId,
          content: messageContents[messageIndex % messageContents.length],
          messageType: 'text',
          attachmentUrl: null,
          replyToId: null,
          isEdited: false,
          editedAt: null,
          createdAt: new Date(now.getTime() - minutesAgo * 60 * 1000),
          updatedAt: new Date(now.getTime() - minutesAgo * 60 * 1000)
        });

        messageIndex++;
      }
    });

    await queryInterface.bulkInsert('messages', messages);

    console.log(`Created ${messages.length} messages across ${Object.keys(conversationMap).length} conversations`);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('messages', null, {});
  }
};
