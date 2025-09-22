const db = require('../../../shared/db');

/**
 * Schedule Model - Handles database operations for doctor schedules
 */
class ScheduleModel {
  /**
   * Create a new schedule entry
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>} Created schedule entry
   */
  static async create(scheduleData) {
    const { 
      doctor_id, 
      day_of_week, 
      start_time, 
      end_time, 
      is_available, 
      location 
    } = scheduleData;
    
    const query = `
      INSERT INTO doctor.schedules (
        doctor_id, day_of_week, start_time, end_time, is_available, location
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      doctor_id,
      day_of_week,
      start_time,
      end_time,
      is_available !== undefined ? is_available : true,
      location
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Create multiple schedule entries in bulk
   * @param {Array<Object>} scheduleEntries - Array of schedule data objects
   * @returns {Promise<Array>} Created schedule entries
   */
  static async createBulk(scheduleEntries) {
    // Start a transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const createdEntries = [];
      
      for (const entry of scheduleEntries) {
        const { 
          doctor_id, 
          day_of_week, 
          start_time, 
          end_time, 
          is_available, 
          location 
        } = entry;
        
        const query = `
          INSERT INTO doctor.schedules (
            doctor_id, day_of_week, start_time, end_time, is_available, location
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const values = [
          doctor_id,
          day_of_week,
          start_time,
          end_time,
          is_available !== undefined ? is_available : true,
          location
        ];
        
        const result = await client.query(query, values);
        createdEntries.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return createdEntries;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get schedule by ID
   * @param {number} id - Schedule entry ID
   * @returns {Promise<Object|null>} Schedule entry or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT s.*, d.first_name, d.last_name, d.doctor_id as doctor_uuid
      FROM doctor.schedules s
      JOIN doctor.doctors d ON s.doctor_id = d.id
      WHERE s.schedule_id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Get all schedules for a doctor
   * @param {number} doctorId - Doctor ID (internal database ID)
   * @returns {Promise<Array>} Array of schedule entries
   */
  static async findByDoctorId(doctorId) {
    const query = `
      SELECT * FROM doctor.schedules
      WHERE doctor_id = $1
      ORDER BY day_of_week, start_time
    `;
    
    const result = await db.query(query, [doctorId]);
    return result.rows;
  }
  
  /**
   * Update schedule entry
   * @param {number} id - Schedule entry ID
   * @param {Object} scheduleData - Schedule data to update
   * @returns {Promise<Object|null>} Updated schedule entry or null if not found
   */
  static async update(id, scheduleData) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(scheduleData)) {
      if (value !== undefined && [
        'doctor_id', 'day_of_week', 'start_time', 'end_time', 'is_available', 'location'
      ].includes(key)) {
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
      UPDATE doctor.schedules
      SET ${fields.join(', ')}
      WHERE schedule_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete schedule entry
   * @param {number} id - Schedule entry ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const query = `
      DELETE FROM doctor.schedules
      WHERE schedule_id = $1
      RETURNING schedule_id
    `;
    
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
  
  /**
   * Get schedules for multiple doctors
   * @param {Array<number>} doctorIds - Array of doctor IDs
   * @returns {Promise<Object>} Object with doctor IDs as keys and schedule arrays as values
   */
  static async getMultipleDoctorSchedules(doctorIds) {
    if (!doctorIds.length) {
      return {};
    }
    
    const placeholders = doctorIds.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      SELECT s.*, d.doctor_id as doctor_uuid
      FROM doctor.schedules s
      JOIN doctor.doctors d ON s.doctor_id = d.id
      WHERE s.doctor_id IN (${placeholders})
      ORDER BY s.doctor_id, s.day_of_week, s.start_time
    `;
    
    const result = await db.query(query, doctorIds);
    
    // Group by doctor_id
    const schedulesByDoctor = {};
    
    for (const row of result.rows) {
      const doctorId = row.doctor_id;
      if (!schedulesByDoctor[doctorId]) {
        schedulesByDoctor[doctorId] = [];
      }
      schedulesByDoctor[doctorId].push(row);
    }
    
    return schedulesByDoctor;
  }
}

module.exports = ScheduleModel;
