const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'database-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'health_services',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  pool: {
    max: 20,
    min: 0,
    idle: 10000
  },
  logging: (msg) => logger.debug(msg)
});

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    return false;
  }
}

// Model registry to keep track of all models
const models = {
  patientService: {},
  doctorService: {},
  appointmentService: {},
  authService: {},
  profileService: {},
  paymentService: {},
  registrationService: {}
};

// Register models from a service
function registerModels(serviceKey, modelMap) {
  models[serviceKey] = { ...models[serviceKey], ...modelMap };
}

// Setup associations between models
function setupAssociations() {
  const { setupAssociations } = require('./associations');
  setupAssociations(models);
}

// Export both Sequelize and the instance
module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  models,
  registerModels,
  setupAssociations
};
