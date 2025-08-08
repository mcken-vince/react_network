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
