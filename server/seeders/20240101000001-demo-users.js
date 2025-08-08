'use strict';

import bcrypt from 'bcryptjs';

export default {
  up: async (queryInterface, _Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = [
      {
        first_name: 'John',
        last_name: 'Doe',
        age: 30,
        location: 'New York, NY',
        username: 'johndoe',
        password: hashedPassword,
        email: 'john.doe@example.com',
        bio: 'Software developer passionate about building great user experiences.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        age: 28,
        location: 'Los Angeles, CA',
        username: 'janesmith',
        password: hashedPassword,
        email: 'jane.smith@example.com',
        bio: 'UI/UX designer who loves creating beautiful and functional designs.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        first_name: 'Bob',
        last_name: 'Johnson',
        age: 35,
        location: 'Chicago, IL',
        username: 'bobjohnson',
        password: hashedPassword,
        email: 'bob.johnson@example.com',
        bio: 'Full-stack developer with 10+ years of experience in web development.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        first_name: 'Alice',
        last_name: 'Williams',
        age: 26,
        location: 'Houston, TX',
        username: 'alicewilliams',
        password: hashedPassword,
        email: 'alice.williams@example.com',
        bio: 'Data scientist exploring the intersection of AI and human behavior.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        first_name: 'Charlie',
        last_name: 'Brown',
        age: 32,
        location: 'Phoenix, AZ',
        username: 'charliebrown',
        password: hashedPassword,
        email: 'charlie.brown@example.com',
        bio: 'Product manager focused on creating technology that makes a difference.',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users, {});
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
