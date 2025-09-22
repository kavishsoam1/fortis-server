const { Patient } = require('./sequelize');
const { sequelize } = require('../../../shared/sequelize');
// const { Op } = require('sequelize');

class PatientModel {
  /**
   * Create a new patient record
   * @param {Object} patientData - Patient data
   * @returns {Promise<Object>} Created patient
   */
  static async create(patientData) {
    // Create patient with Sequelize
    const patient = await Patient.create(patientData);
    return patient;
  }
  
  /**
   * Get all patients with optional pagination
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Number of records to skip
   * @returns {Promise<Array>} Array of patients
   */
  static async findAll(limit = 100, offset = 0) {
    // Get all patients with pagination using Sequelize
    const patients = await Patient.findAll({
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    return patients;
  }
  
  /**
   * Get patient by ID
   * @param {number} id - Patient ID
   * @returns {Promise<Object|null>} Patient data or null if not found
   */
  static async findById(id) {
    // Find patient by primary key using Sequelize
    return await Patient.findByPk(id);
  }
  
  /**
   * Update patient by ID
   * @param {number} id - Patient ID
   * @param {Object} patientData - Updated patient data
   * @returns {Promise<Object|null>} Updated patient or null if not found
   */
  static async update(id, patientData) {
    // Update patient using Sequelize
    const [updatedRowsCount, updatedRows] = await Patient.update(patientData, {
      where: { id },
      returning: true
    });
    
    if (updatedRowsCount === 0) {
      return null;
    }
    
    return updatedRows[0];
  }
  
  /**
   * Delete patient by ID
   * @param {number} id - Patient ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    // Delete patient using Sequelize
    const deletedCount = await Patient.destroy({
      where: { id }
    });
    
    return deletedCount > 0;
  }
  
  /**
   * Get patient appointments
   * @param {number} id - Patient ID
   * @returns {Promise<Array>} Array of appointments
   */
  static async getAppointments(id) {
    // Get all appointments for the patient with doctor information
    const appointments = await sequelize.models.Appointment.findAll({
      where: { member_id: id },
      include: [{
        model: sequelize.models.Doctor,
        as: 'Doctor',
        attributes: ['first_name', 'last_name']
      }],
      order: [['appointment_date', 'DESC']]
    });
    
    // Format the data to match the expected structure
    return appointments.map(appointment => {
      const plainAppointment = appointment.get({ plain: true });
      
      // Add formatted fields
      if (plainAppointment.Doctor) {
        plainAppointment.doctor_first_name = plainAppointment.Doctor.first_name;
        plainAppointment.doctor_last_name = plainAppointment.Doctor.last_name;
        delete plainAppointment.Doctor;
      }
      
      return plainAppointment;
    });
  }
}

module.exports = PatientModel;
