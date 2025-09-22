const Doctor = require('./Doctor');
const Department = require('./Department');
const Specialty = require('./DoctorSpecialty');
const Schedule = require('./Schedule');
const TimeOff = require('./TimeOff');
const { 
  testConnection, 
  registerModels, 
  setupAssociations 
} = require('../../../../shared/sequelize');

// Test database connection
testConnection();

// Local relationships
Doctor.belongsTo(Department, { foreignKey: 'department_id' });
Doctor.belongsTo(Specialty, { foreignKey: 'specialty_id' });

Department.hasMany(Doctor, { foreignKey: 'department_id' });
Department.hasMany(Specialty, { foreignKey: 'department_id' });

Specialty.hasMany(Doctor, { foreignKey: 'specialty_id' });
Specialty.belongsTo(Department, { foreignKey: 'department_id' });

Schedule.belongsTo(Doctor, { foreignKey: 'doctor_id' });
Doctor.hasMany(Schedule, { foreignKey: 'doctor_id' });

TimeOff.belongsTo(Doctor, { foreignKey: 'doctor_id' });
Doctor.hasMany(TimeOff, { foreignKey: 'doctor_id' });

// Register models with the central registry
registerModels('doctorService', {
  Doctor,
  Department,
  Specialty,
  Schedule,
  TimeOff
});

// Setup cross-service associations
setupAssociations();

module.exports = {
  Doctor,
  Department,
  Specialty,
  Schedule,
  TimeOff
};
