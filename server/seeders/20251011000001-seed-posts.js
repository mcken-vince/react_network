import { randomUUID } from 'node:crypto';

export default {
  async up(queryInterface, Sequelize) {
    // Get all users to create posts for them
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users LIMIT 10;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log('No users found. Skipping post seeding.');
      return;
    }

    const posts = [];
    const now = new Date();

    const samplePosts = [
      "Just finished an amazing book on software architecture! 📚 #learning",
      "Beautiful sunset today 🌅",
      "Coffee is the answer, no matter what the question is ☕",
      "Excited to announce my new project launch! 🚀",
      "Weekend vibes are the best vibes 🎉",
      "Learning something new every day keeps the mind sharp 🧠",
      "Great workout session this morning! 💪",
      "Happy to connect with amazing people on this platform!",
      "Coding late into the night... again 💻",
      "Life is better when you're laughing 😄",
      "Just deployed a new feature to production! 🎯",
      "Taking a break to enjoy nature 🌲",
      "Grateful for good friends and good times",
      "Working on improving my skills one day at a time",
      "The journey is just as important as the destination",
    ];

    const visibilityOptions = ['public', 'friends', 'private'];

    // Create 3-5 posts for each user
    users.forEach((user, _userIndex) => {
      const numPosts = 3 + Math.floor(Math.random() * 3); // 3-5 posts
      
      for (let i = 0; i < numPosts; i++) {
        const daysAgo = Math.floor(Math.random() * 30); // Posts within last 30 days
        const postDate = new Date(now);
        postDate.setDate(postDate.getDate() - daysAgo);

        posts.push({
          id: randomUUID(),
          userId: user.id,
          content: samplePosts[Math.floor(Math.random() * samplePosts.length)],
          imageUrl: null,
          visibility: visibilityOptions[Math.floor(Math.random() * visibilityOptions.length)],
          createdAt: postDate,
          updatedAt: postDate
        });
      }
    });

    await queryInterface.bulkInsert('posts', posts);
    console.log(`Seeded ${posts.length} posts for ${users.length} users`);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('posts', null, {});
  }
};
