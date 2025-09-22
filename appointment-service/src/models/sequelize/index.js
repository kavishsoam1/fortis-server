const Appointment = require('./Appointment');
const AppointmentAudit = require('./AppointmentAudit');
const { 
  testConnection, 
  registerModels, 
  setupAssociations 
} = require('../../../../shared/sequelize');

// Test database connection
testConnection();

// Local relationships
Appointment.hasMany(AppointmentAudit, { foreignKey: 'appointment_id' });
AppointmentAudit.belongsTo(Appointment, { foreignKey: 'appointment_id' });

// Self-reference for follow-up appointments
Appointment.belongsTo(Appointment, { as: 'FollowUpAppointment', foreignKey: 'follow_up_appointment_id' });
Appointment.hasOne(Appointment, { as: 'PreviousAppointment', foreignKey: 'follow_up_appointment_id' });

// Register models with the central registry
registerModels('appointmentService', {
  Appointment,
  AppointmentAudit
});

// Setup cross-service associations
setupAssociations();

module.exports = {
  Appointment,
  AppointmentAudit
};
