'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Add email column
    await queryInterface.addColumn('users', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    });

    // Add bio column
    await queryInterface.addColumn('users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Create index on email for faster lookups
    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
      unique: false
    });
  },

  down: async (queryInterface, _Sequelize) => {
    // Remove the index first
    await queryInterface.removeIndex('users', 'idx_users_email');
    
    // Remove the columns
    await queryInterface.removeColumn('users', 'email');
    await queryInterface.removeColumn('users', 'bio');
  }
};
