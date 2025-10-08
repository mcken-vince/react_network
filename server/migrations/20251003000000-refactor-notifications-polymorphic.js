'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Add new polymorphic columns
    await queryInterface.addColumn('notifications', 'related_entity_type', {
      type: Sequelize.STRING(50),
      allowNull: true,
      after: 'related_user_id'
    });

    await queryInterface.addColumn('notifications', 'related_entity_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'related_entity_type'
    });

    // Migrate existing data: copy connectionId to the new polymorphic fields
    await queryInterface.sequelize.query(`
      UPDATE notifications 
      SET related_entity_type = 'connection', 
          related_entity_id = connection_id 
      WHERE connection_id IS NOT NULL
    `);

    // Add index for polymorphic association
    await queryInterface.addIndex('notifications', ['related_entity_type', 'related_entity_id'], {
      name: 'idx_notifications_polymorphic'
    });

    // Remove the old connectionId foreign key constraint
    // Note: The constraint name may vary by database
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications 
      DROP CONSTRAINT IF EXISTS notifications_connection_id_fkey
    `);

    // Remove the old connectionId column
    await queryInterface.removeColumn('notifications', 'connection_id');
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add the connectionId column
    await queryInterface.addColumn('notifications', 'connection_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'connections',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Migrate data back: copy related_entity_id back to connectionId where type is 'connection'
    await queryInterface.sequelize.query(`
      UPDATE notifications 
      SET connection_id = related_entity_id 
      WHERE related_entity_type = 'connection' AND related_entity_id IS NOT NULL
    `);

    // Remove the polymorphic index
    await queryInterface.removeIndex('notifications', 'idx_notifications_polymorphic');

    // Remove the new polymorphic columns
    await queryInterface.removeColumn('notifications', 'related_entity_id');
    await queryInterface.removeColumn('notifications', 'related_entity_type');
  }
};
