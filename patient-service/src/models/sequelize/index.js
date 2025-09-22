const Patient = require('./Patient');
const { 
  testConnection, 
  registerModels, 
  setupAssociations 
} = require('../../../../shared/sequelize');

// Test database connection
testConnection();

// Register models with the central registry
registerModels('patientService', {
  Patient
});

// Setup cross-service associations
setupAssociations();

module.exports = {
  Patient
};
