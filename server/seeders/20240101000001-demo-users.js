'use strict';

import bcrypt from 'bcryptjs';

export default {
  up: async (queryInterface, _Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = [
      {
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        location: 'New York, NY',
        username: 'johndoe',
        password: hashedPassword,
        email: 'john.doe@example.com',
        bio: 'Software developer passionate about building great user experiences.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        age: 28,
        location: 'Los Angeles, CA',
        username: 'janesmith',
        password: hashedPassword,
        email: 'jane.smith@example.com',
        bio: 'UI/UX designer who loves creating beautiful and functional designs.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        age: 35,
        location: 'Chicago, IL',
        username: 'bobjohnson',
        password: hashedPassword,
        email: 'bob.johnson@example.com',
        bio: 'Full-stack developer with 10+ years of experience in web development.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Alice',
        lastName: 'Williams',
        age: 26,
        location: 'Houston, TX',
        username: 'alicewilliams',
        password: hashedPassword,
        email: 'alice.williams@example.com',
        bio: 'Data scientist exploring the intersection of AI and human behavior.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Charlie',
        lastName: 'Brown',
        age: 32,
        location: 'Phoenix, AZ',
        username: 'charliebrown',
        password: hashedPassword,
        email: 'charlie.brown@example.com',
        bio: 'Product manager focused on creating technology that makes a difference.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users, {});
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
