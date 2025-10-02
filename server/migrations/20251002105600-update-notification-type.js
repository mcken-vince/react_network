'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('notifications', 'type', {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.changeColumn('notifications', 'type', {
      type: _Sequelize.ENUM('connection_request', 'connection_accepted', 'connection_rejected'),
      allowNull: false,
    });
  }
};
