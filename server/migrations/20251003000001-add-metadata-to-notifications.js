'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Add metadata column for flexible additional data
    await queryInterface.addColumn('notifications', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Additional flexible metadata for future extensibility'
    });

    // Initialize existing rows with empty metadata
    await queryInterface.sequelize.query(`
      UPDATE notifications 
      SET metadata = '{}'::jsonb
      WHERE metadata IS NULL
    `);
  },

  down: async (queryInterface, _Sequelize) => {
    // Remove the metadata column
    await queryInterface.removeColumn('notifications', 'metadata');
  }
};
