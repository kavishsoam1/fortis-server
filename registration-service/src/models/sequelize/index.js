const Registration = require('./Registration');
const Document = require('./Document');
const { testConnection } = require('../../../../shared/sequelize');

// Test database connection
testConnection();

// Define relationships
Registration.hasMany(Document, { foreignKey: 'registration_id' });
Document.belongsTo(Registration, { foreignKey: 'registration_id' });

module.exports = {
  Registration,
  Document
};
