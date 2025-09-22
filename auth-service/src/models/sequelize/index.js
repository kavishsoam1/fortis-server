const User = require('./User');
const OTP = require('./OTP');
const UserSession = require('./UserSession');
const { 
  testConnection, 
  registerModels, 
  setupAssociations 
} = require('../../../../shared/sequelize');

// Test database connection
testConnection();

// Local relationships
User.hasMany(UserSession, { foreignKey: 'user_id' });
UserSession.belongsTo(User, { foreignKey: 'user_id' });

// Register models with the central registry
registerModels('authService', {
  User,
  OTP,
  UserSession
});

// Setup cross-service associations
setupAssociations();

module.exports = {
  User,
  OTP,
  UserSession
};
