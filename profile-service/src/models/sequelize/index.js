const Member = require('./Member');
const MemberHealthData = require('./MemberHealthData');
const { testConnection } = require('../../../../shared/sequelize');

// Test database connection
testConnection();

// Define relationships
Member.hasOne(MemberHealthData, { foreignKey: 'member_id' });
MemberHealthData.belongsTo(Member, { foreignKey: 'member_id' });

module.exports = {
  Member,
  MemberHealthData
};
