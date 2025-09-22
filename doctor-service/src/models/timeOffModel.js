const db = require('../../../shared/db');

/**
 * TimeOff Model - Handles database operations for doctor time-off periods
 */
class TimeOffModel {
  /**
   * Create a new time-off entry
   * @param {Object} timeOffData - Time-off data
   * @returns {Promise<Object>} Created time-off entry
   */
  static async create(timeOffData) {
    const { doctor_id, start_datetime, end_datetime, reason } = timeOffData;
    
    const query = `
      INSERT INTO doctor.time_off (
        doctor_id, start_datetime, end_datetime, reason
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      doctor_id,
      start_datetime,
      end_datetime,
      reason
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Get time-off entry by ID
   * @param {number} id - Time-off entry ID
   * @returns {Promise<Object|null>} Time-off entry or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT t.*, d.first_name, d.last_name, d.doctor_id as doctor_uuid
      FROM doctor.time_off t
      JOIN doctor.doctors d ON t.doctor_id = d.id
      WHERE t.time_off_id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Get all time-off entries for a doctor
   * @param {number} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @param {string} [options.startDate] - Filter entries ending after this date
   * @param {string} [options.endDate] - Filter entries starting before this date
   * @returns {Promise<Array>} Array of time-off entries
   */
  static async findByDoctorId(doctorId, options = {}) {
    const { startDate, endDate } = options;
    const params = [doctorId];
    let paramCount = 2;
    
    let query = `
      SELECT * FROM doctor.time_off
      WHERE doctor_id = $1
    `;
    
    if (startDate) {
      query += ` AND end_datetime >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      query += ` AND start_datetime <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }
    
    query += ` ORDER BY start_datetime ASC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }
  
  /**
   * Update time-off entry
   * @param {number} id - Time-off entry ID
   * @param {Object} timeOffData - Time-off data to update
   * @returns {Promise<Object|null>} Updated time-off entry or null if not found
   */
  static async update(id, timeOffData) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(timeOffData)) {
      if (value !== undefined && ['doctor_id', 'start_datetime', 'end_datetime', 'reason'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (fields.length === 0) {
      return null; // No fields to update
    }
    
    // Add updated_at timestamp
    fields.push('updated_at = CURRENT_TIMESTAMP');
    
    values.push(id); // Add ID as the last parameter
    
    const query = `
      UPDATE doctor.time_off
      SET ${fields.join(', ')}
      WHERE time_off_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete time-off entry
   * @param {number} id - Time-off entry ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const query = `
      DELETE FROM doctor.time_off
      WHERE time_off_id = $1
      RETURNING time_off_id
    `;
    
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
  
  /**
   * Find overlapping time-off entries for a doctor
   * @param {number} doctorId - Doctor ID
   * @param {string} startDatetime - Start datetime
   * @param {string} endDatetime - End datetime
   * @param {number} [excludeId] - Optional time-off ID to exclude from check
   * @returns {Promise<Array>} Array of overlapping time-off entries
   */
  static async findOverlapping(doctorId, startDatetime, endDatetime, excludeId = null) {
    let query = `
      SELECT * FROM doctor.time_off
      WHERE doctor_id = $1
        AND (
          (start_datetime <= $2 AND end_datetime > $2)
          OR
          (start_datetime < $3 AND end_datetime >= $3)
          OR
          (start_datetime >= $2 AND start_datetime < $3)
        )
    `;
    
    const params = [doctorId, startDatetime, endDatetime];
    
    if (excludeId) {
      query += ` AND time_off_id != $4`;
      params.push(excludeId);
    }
    
    const result = await db.query(query, params);
    return result.rows;
  }
  
  /**
   * Get time-off entries for a date range (across all doctors)
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Array of time-off entries
   */
  static async findByDateRange(startDate, endDate) {
    const query = `
      SELECT t.*, d.first_name, d.last_name, d.doctor_id as doctor_uuid
      FROM doctor.time_off t
      JOIN doctor.doctors d ON t.doctor_id = d.id
      WHERE (t.start_datetime <= $2 AND t.end_datetime >= $1)
      ORDER BY t.start_datetime ASC
    `;
    
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }
}

module.exports = TimeOffModel;
