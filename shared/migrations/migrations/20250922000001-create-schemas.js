'use strict';

const { createSchema, dropSchema } = require('../utils/schema-helpers');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create all schemas used in our microservices
    await createSchema(queryInterface, 'auth');
    await createSchema(queryInterface, 'patient');
    await createSchema(queryInterface, 'doctor');
    await createSchema(queryInterface, 'appointment');
    await createSchema(queryInterface, 'profile');
    await createSchema(queryInterface, 'payment');
    await createSchema(queryInterface, 'registration');
  },

  async down (queryInterface, Sequelize) {
    // Drop all schemas
    await dropSchema(queryInterface, 'registration');
    await dropSchema(queryInterface, 'payment');
    await dropSchema(queryInterface, 'profile');
    await dropSchema(queryInterface, 'appointment');
    await dropSchema(queryInterface, 'doctor');
    await dropSchema(queryInterface, 'patient');
    await dropSchema(queryInterface, 'auth');
  }
};
