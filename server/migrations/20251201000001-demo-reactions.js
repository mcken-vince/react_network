'use strict';
// Weighted so the demo looks plausible: lots of likes, the occasional angry.
const WEIGHTED_TYPES = [
  'like', 'like', 'like', 'like', 'love', 'love',
  'laugh', 'laugh', 'wow', 'sad', 'celebrate', 'angry'
];
const pick = (items) => items[Math.floor(Math.random() * items.length)];

export default {
  up: async (queryInterface, Sequelize) => {
    const select = (sql) =>
      queryInterface.sequelize.query(sql, { type: Sequelize.QueryTypes.SELECT });
    const [users, posts, messages, participants, existing] = await Promise.all([
      select('SELECT id FROM users'),
      // Public only, so reactors can always actually see what they reacted to.
      select(`SELECT id, "userId" FROM posts WHERE visibility = 'public'`),
      select(`SELECT id, "conversationId", "senderId" FROM messages
              WHERE "deletedAt" IS NULL AND "messageType" <> 'system'`),
      select(`SELECT "conversationId", "userId" FROM "conversationParticipants" WHERE "isActive" = true`),
      select(`SELECT "targetType", "targetId", "userId" FROM reactions`)
    ]);
    // One reaction per user per target (the default "single" policy), and
    // never collide with rows already backfilled from postLikes.
    const taken = new Set(existing.map((r) => `${r.targetType}:${r.targetId}:${r.userId}`));
    const now = new Date();
    const rows = [];
    const add = (targetType, targetId, userId) => {
      const key = `${targetType}:${targetId}:${userId}`;
      if (taken.has(key)) return;
      taken.add(key);
      rows.push({ targetType, targetId, userId, type: pick(WEIGHTED_TYPES), createdAt: now, updatedAt: now });
    };
    for (const post of posts) {
      for (const user of users) {
        if (user.id !== post.userId && Math.random() < 0.4) add('post', post.id, user.id);
      }
    }
    const members = new Map();
    for (const p of participants) {
      if (!members.has(p.conversationId)) members.set(p.conversationId, []);
      members.get(p.conversationId).push(p.userId);
    }
    for (const message of messages) {
      for (const userId of members.get(message.conversationId) ?? []) {
        if (userId !== message.senderId && Math.random() < 0.25) add('message', message.id, userId);
      }
    }
    if (rows.length > 0) await queryInterface.bulkInsert('reactions', rows);
    console.log(`Seeded ${rows.length} reactions`);
  },
  // Note: removes every reaction, including ones backfilled from postLikes.
  down: async (queryInterface, _Sequelize) => {
    await queryInterface.bulkDelete('reactions', null, {});
  }
};