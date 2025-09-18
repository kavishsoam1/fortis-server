const db = require('../../../shared/db');

/**
 * Patient Model - Handles database operations for patients
 */
class PatientModel {
  /**
   * Create a new patient record
   * @param {Object} patientData - Patient data
   * @returns {Promise<Object>} Created patient
   */
  static async create(patientData) {
    const { first_name, last_name, email, phone, date_of_birth, address, medical_history } = patientData;
    
    const query = `
      INSERT INTO patient.patients (
        first_name, last_name, email, phone, date_of_birth, address, medical_history
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [first_name, last_name, email, phone, date_of_birth, address, medical_history];
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Get all patients with optional pagination
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Number of records to skip
   * @returns {Promise<Array>} Array of patients
   */
  static async findAll(limit = 100, offset = 0) {
    const query = `
      SELECT * FROM patient.patients
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }
  
  /**
   * Get patient by ID
   * @param {number} id - Patient ID
   * @returns {Promise<Object|null>} Patient data or null if not found
   */
  static async findById(id) {
    const query = `SELECT * FROM patient.patients WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Update patient by ID
   * @param {number} id - Patient ID
   * @param {Object} patientData - Updated patient data
   * @returns {Promise<Object|null>} Updated patient or null if not found
   */
  static async update(id, patientData) {
    // Extract only the fields that are provided
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(patientData)) {
      if (value !== undefined && [
        'first_name', 'last_name', 'email', 'phone', 
        'date_of_birth', 'address', 'medical_history'
      ].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (fields.length === 0) {
      return null; // No fields to update
    }
    
    values.push(id); // Add ID as the last parameter
    
    const query = `
      UPDATE patient.patients
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete patient by ID
   * @param {number} id - Patient ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const query = `DELETE FROM patient.patients WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
  
  /**
   * Get patient appointments
   * @param {number} id - Patient ID
   * @returns {Promise<Array>} Array of appointments
   */
  static async getAppointments(id) {
    const query = `
      SELECT a.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM appointment.appointments a
      JOIN doctor.doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC
    `;
    
    const result = await db.query(query, [id]);
    return result.rows;
  }
}

module.exports = PatientModel;
