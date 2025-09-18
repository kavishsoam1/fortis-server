const db = require('../../../shared/db');

/**
 * Appointment Model - Handles database operations for appointments
 */
class AppointmentModel {
  /**
   * Create a new appointment record
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  static async create(appointmentData) {
    const { 
      patient_id, 
      doctor_id, 
      appointment_date, 
      duration_minutes, 
      status, 
      notes 
    } = appointmentData;
    
    const query = `
      INSERT INTO appointment.appointments (
        patient_id, doctor_id, appointment_date, duration_minutes, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      patient_id,
      doctor_id,
      appointment_date,
      duration_minutes || 30,
      status || 'scheduled',
      notes
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Get all appointments with optional pagination
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Number of records to skip
   * @returns {Promise<Array>} Array of appointments
   */
  static async findAll(limit = 100, offset = 0) {
    const query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name, 
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name, 
        d.last_name as doctor_last_name,
        d.specialization as doctor_specialization
      FROM appointment.appointments a
      JOIN patient.patients p ON a.patient_id = p.id
      JOIN doctor.doctors d ON a.doctor_id = d.id
      ORDER BY a.appointment_date DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }
  
  /**
   * Get appointment by ID
   * @param {number} id - Appointment ID
   * @returns {Promise<Object|null>} Appointment data or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name, 
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name, 
        d.last_name as doctor_last_name,
        d.specialization as doctor_specialization
      FROM appointment.appointments a
      JOIN patient.patients p ON a.patient_id = p.id
      JOIN doctor.doctors d ON a.doctor_id = d.id
      WHERE a.id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Get appointments by doctor ID
   * @param {number} doctorId - Doctor ID
   * @param {string} [startDate] - Optional start date filter
   * @param {string} [endDate] - Optional end date filter
   * @returns {Promise<Array>} Array of appointments
   */
  static async findByDoctorId(doctorId, startDate, endDate) {
    let query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name, 
        p.last_name as patient_last_name
      FROM appointment.appointments a
      JOIN patient.patients p ON a.patient_id = p.id
      WHERE a.doctor_id = $1
    `;
    
    const params = [doctorId];
    
    if (startDate && endDate) {
      query += ` AND a.appointment_date BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    }
    
    query += ` ORDER BY a.appointment_date ASC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }
  
  /**
   * Get appointments by patient ID
   * @param {number} patientId - Patient ID
   * @param {string} [startDate] - Optional start date filter
   * @param {string} [endDate] - Optional end date filter
   * @returns {Promise<Array>} Array of appointments
   */
  static async findByPatientId(patientId, startDate, endDate) {
    let query = `
      SELECT 
        a.*,
        d.first_name as doctor_first_name, 
        d.last_name as doctor_last_name,
        d.specialization as doctor_specialization
      FROM appointment.appointments a
      JOIN doctor.doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = $1
    `;
    
    const params = [patientId];
    
    if (startDate && endDate) {
      query += ` AND a.appointment_date BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    }
    
    query += ` ORDER BY a.appointment_date ASC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }
  
  /**
   * Get appointments by status
   * @param {string} status - Appointment status
   * @returns {Promise<Array>} Array of appointments
   */
  static async findByStatus(status) {
    const query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name, 
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name, 
        d.last_name as doctor_last_name,
        d.specialization as doctor_specialization
      FROM appointment.appointments a
      JOIN patient.patients p ON a.patient_id = p.id
      JOIN doctor.doctors d ON a.doctor_id = d.id
      WHERE a.status = $1
      ORDER BY a.appointment_date ASC
    `;
    
    const result = await db.query(query, [status]);
    return result.rows;
  }
  
  /**
   * Get appointments by date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Array of appointments
   */
  static async findByDateRange(startDate, endDate) {
    const query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name, 
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name, 
        d.last_name as doctor_last_name,
        d.specialization as doctor_specialization
      FROM appointment.appointments a
      JOIN patient.patients p ON a.patient_id = p.id
      JOIN doctor.doctors d ON a.doctor_id = d.id
      WHERE a.appointment_date BETWEEN $1 AND $2
      ORDER BY a.appointment_date ASC
    `;
    
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }
  
  /**
   * Update appointment by ID
   * @param {number} id - Appointment ID
   * @param {Object} appointmentData - Updated appointment data
   * @returns {Promise<Object|null>} Updated appointment or null if not found
   */
  static async update(id, appointmentData) {
    // Extract only the fields that are provided
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(appointmentData)) {
      if (value !== undefined && [
        'patient_id', 'doctor_id', 'appointment_date', 
        'duration_minutes', 'status', 'notes'
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
      UPDATE appointment.appointments
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Update appointment status
   * @param {number} id - Appointment ID
   * @param {string} status - New status
   * @returns {Promise<Object|null>} Updated appointment or null if not found
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE appointment.appointments
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [status, id]);
    return result.rows[0] || null;
  }
  
  /**
   * Delete appointment by ID
   * @param {number} id - Appointment ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const query = `DELETE FROM appointment.appointments WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
  
  /**
   * Check for appointment conflicts
   * @param {number} doctorId - Doctor ID
   * @param {Date} appointmentDate - Appointment date and time
   * @param {number} durationMinutes - Duration of the appointment in minutes
   * @param {number} [excludeAppointmentId] - Optional ID to exclude from conflict check
   * @returns {Promise<boolean>} True if conflict exists, false otherwise
   */
  static async checkForConflicts(doctorId, appointmentDate, durationMinutes, excludeAppointmentId = null) {
    const appointmentEndTime = new Date(new Date(appointmentDate).getTime() + durationMinutes * 60000);
    
    let query = `
      SELECT COUNT(*) FROM appointment.appointments
      WHERE doctor_id = $1
        AND status != 'cancelled'
        AND (
          (appointment_date <= $2 AND appointment_date + (duration_minutes * interval '1 minute') > $2)
          OR
          (appointment_date < $3 AND appointment_date + (duration_minutes * interval '1 minute') >= $3)
          OR
          (appointment_date >= $2 AND appointment_date < $3)
        )
    `;
    
    const params = [doctorId, appointmentDate, appointmentEndTime];
    
    if (excludeAppointmentId) {
      query += ` AND id != $4`;
      params.push(excludeAppointmentId);
    }
    
    const result = await db.query(query, params);
    return parseInt(result.rows[0].count) > 0;
  }
}

module.exports = AppointmentModel;
