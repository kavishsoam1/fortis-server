const db = require('../../../shared/db');

/**
 * Doctor Model - Handles database operations for doctors
 */
class DoctorModel {
  /**
   * Create a new doctor record
   * @param {Object} doctorData - Doctor data
   * @returns {Promise<Object>} Created doctor
   */
  static async create(doctorData) {
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      specialization, 
      license_number, 
      years_of_experience 
    } = doctorData;
    
    const query = `
      INSERT INTO doctor.doctors (
        first_name, last_name, email, phone, specialization, license_number, years_of_experience
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      first_name, 
      last_name, 
      email, 
      phone, 
      specialization, 
      license_number, 
      years_of_experience
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Get all doctors with optional pagination
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Number of records to skip
   * @returns {Promise<Array>} Array of doctors
   */
  static async findAll(limit = 100, offset = 0) {
    const query = `
      SELECT * FROM doctor.doctors
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }
  
  /**
   * Get doctor by ID
   * @param {number} id - Doctor ID
   * @returns {Promise<Object|null>} Doctor data or null if not found
   */
  static async findById(id) {
    const query = `SELECT * FROM doctor.doctors WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find doctors by specialization
   * @param {string} specialization - Doctor specialization to search for
   * @returns {Promise<Array>} Array of doctors with the specified specialization
   */
  static async findBySpecialization(specialization) {
    const query = `
      SELECT * FROM doctor.doctors
      WHERE specialization ILIKE $1
      ORDER BY years_of_experience DESC, created_at ASC
    `;
    
    const result = await db.query(query, [`%${specialization}%`]);
    return result.rows;
  }
  
  /**
   * Update doctor by ID
   * @param {number} id - Doctor ID
   * @param {Object} doctorData - Updated doctor data
   * @returns {Promise<Object|null>} Updated doctor or null if not found
   */
  static async update(id, doctorData) {
    // Extract only the fields that are provided
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(doctorData)) {
      if (value !== undefined && [
        'first_name', 'last_name', 'email', 'phone', 
        'specialization', 'license_number', 'years_of_experience'
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
      UPDATE doctor.doctors
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete doctor by ID
   * @param {number} id - Doctor ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const query = `DELETE FROM doctor.doctors WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
  
  /**
   * Get doctor's appointments
   * @param {number} id - Doctor ID
   * @returns {Promise<Array>} Array of appointments
   */
  static async getAppointments(id) {
    const query = `
      SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name
      FROM appointment.appointments a
      JOIN patient.patients p ON a.patient_id = p.id
      WHERE a.doctor_id = $1
      ORDER BY a.appointment_date ASC
    `;
    
    const result = await db.query(query, [id]);
    return result.rows;
  }
  
  /**
   * Get doctor's schedule for a specific date range
   * @param {number} id - Doctor ID
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {Promise<Array>} Array of appointments in the date range
   */
  static async getSchedule(id, startDate, endDate) {
    const query = `
      SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name
      FROM appointment.appointments a
      JOIN patient.patients p ON a.patient_id = p.id
      WHERE a.doctor_id = $1
        AND a.appointment_date >= $2
        AND a.appointment_date <= $3
      ORDER BY a.appointment_date ASC
    `;
    
    const result = await db.query(query, [id, startDate, endDate]);
    return result.rows;
  }
}

module.exports = DoctorModel;
