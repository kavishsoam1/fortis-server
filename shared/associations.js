/**
 * Centralized file for defining cross-service associations between Sequelize models
 * This helps maintain proper relationships when models are in different services/schemas
 */
// const { sequelize } = require('./sequelize');

/**
 * Setup cross-service associations between models
 * @param {Object} models - Object containing model references from all services
 */
function setupAssociations(models) {
  // Extract models from services
  const { Patient } = models.patientService || {};
  const { Doctor, Department, Specialty, Schedule, TimeOff } = models.doctorService || {};
  const { Appointment, AppointmentAudit } = models.appointmentService || {};
  const { User, UserSession } = models.authService || {};
  const { Member, MemberHealthData } = models.profileService || {};
  const { Payment, Invoice } = models.paymentService || {};
  const { Registration, Document } = models.registrationService || {};

  // Only set up associations if both models in the relationship exist
  
  // Doctor-Department associations
  if (Doctor && Department) {
    Doctor.belongsTo(Department, { foreignKey: 'department_id' });
    Department.hasMany(Doctor, { foreignKey: 'department_id' });
  }

  // Doctor-Specialty associations
  if (Doctor && Specialty) {
    Doctor.belongsTo(Specialty, { foreignKey: 'specialty_id' });
    Specialty.hasMany(Doctor, { foreignKey: 'specialty_id' });
  }

  // Doctor-Schedule associations
  if (Doctor && Schedule) {
    Doctor.hasMany(Schedule, { foreignKey: 'doctor_id' });
    Schedule.belongsTo(Doctor, { foreignKey: 'doctor_id' });
  }

  // Doctor-TimeOff associations
  if (Doctor && TimeOff) {
    Doctor.hasMany(TimeOff, { foreignKey: 'doctor_id' });
    TimeOff.belongsTo(Doctor, { foreignKey: 'doctor_id' });
  }

  // Department-Specialty associations
  if (Department && Specialty) {
    Department.hasMany(Specialty, { foreignKey: 'department_id' });
    Specialty.belongsTo(Department, { foreignKey: 'department_id' });
  }

  // Appointment associations
  if (Appointment) {
    if (AppointmentAudit) {
      Appointment.hasMany(AppointmentAudit, { foreignKey: 'appointment_id' });
      AppointmentAudit.belongsTo(Appointment, { foreignKey: 'appointment_id' });
    }

    // Cross-service associations
    if (Doctor) {
      Doctor.hasMany(Appointment, { foreignKey: 'doctor_id' });
      Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'Doctor' });
    }
    
    if (Patient) {
      Patient.hasMany(Appointment, { foreignKey: 'member_id' });
      Appointment.belongsTo(Patient, { foreignKey: 'member_id', as: 'Patient' });
    }
    
    if (Member) {
      Member.hasMany(Appointment, { foreignKey: 'member_id' });
      Appointment.belongsTo(Member, { foreignKey: 'member_id', as: 'Member' });
    }

    // Self-reference for follow-up appointments
    Appointment.belongsTo(Appointment, { as: 'FollowUpAppointment', foreignKey: 'follow_up_appointment_id' });
    Appointment.hasOne(Appointment, { as: 'PreviousAppointment', foreignKey: 'follow_up_appointment_id' });
  }

  // User-Member associations (cross-service)
  if (User && Member) {
    User.hasOne(Member, { foreignKey: 'user_id' });
    Member.belongsTo(User, { foreignKey: 'user_id' });
  }

  // User-Session associations
  if (User && UserSession) {
    User.hasMany(UserSession, { foreignKey: 'user_id' });
    UserSession.belongsTo(User, { foreignKey: 'user_id' });
  }

  // Member-Health associations
  if (Member && MemberHealthData) {
    Member.hasOne(MemberHealthData, { foreignKey: 'member_id' });
    MemberHealthData.belongsTo(Member, { foreignKey: 'member_id' });
  }

  // Payment-Invoice associations
  if (Payment && Invoice) {
    Invoice.hasMany(Payment, { foreignKey: 'invoice_id' });
    Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });
  }

  // Registration-Document associations
  if (Registration && Document) {
    Registration.hasMany(Document, { foreignKey: 'registration_id' });
    Document.belongsTo(Registration, { foreignKey: 'registration_id' });
  }

  // Registration-User associations (cross-service)
  if (Registration && User) {
    Registration.belongsTo(User, { foreignKey: 'user_id' });
    User.hasMany(Registration, { foreignKey: 'user_id' });
  }

  return models;
}

module.exports = { setupAssociations };
