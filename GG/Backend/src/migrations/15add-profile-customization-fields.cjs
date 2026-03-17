'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('UserProfiles', 'learning_goal', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('UserProfiles', 'communication_style', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('UserProfiles', 'commitment_level', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 3,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('UserProfiles', 'learning_goal');
    await queryInterface.removeColumn('UserProfiles', 'communication_style');
    await queryInterface.removeColumn('UserProfiles', 'commitment_level');
  },
};
