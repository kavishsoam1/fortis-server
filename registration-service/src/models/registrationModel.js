const db = require('../../../shared/db');

/**
 * Registration Model - Handles database operations for patient registration
 */
class RegistrationModel {
  /**
   * Create a new patient registration record
   * @param {Object} registrationData - Registration data
   * @returns {Promise<Object>} Created registration record
   */
  static async create(registrationData) {
    const { 
      member_id, 
      hospital_guid, 
      status, 
      consent_flags, 
      external_payload 
    } = registrationData;
    
    const query = `
      INSERT INTO registration.patient_registry (
        member_id, hospital_guid, status, consent_flags, external_payload
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      member_id,
      hospital_guid,
      status || 'pending',
      consent_flags || {},
      external_payload || {}
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Find registration by member ID
   * @param {string} memberId - Member ID
   * @returns {Promise<Object|null>} Registration data or null if not found
   */
  static async findByMemberId(memberId) {
    const query = `SELECT * FROM registration.patient_registry WHERE member_id = $1`;
    const result = await db.query(query, [memberId]);
    return result.rows[0] || null;
  }
  
  /**
   * Find registration by hospital GUID
   * @param {string} hospitalGuid - Hospital GUID
   * @returns {Promise<Object|null>} Registration data or null if not found
   */
  static async findByHospitalGuid(hospitalGuid) {
    const query = `SELECT * FROM registration.patient_registry WHERE hospital_guid = $1`;
    const result = await db.query(query, [hospitalGuid]);
    return result.rows[0] || null;
  }
  
  /**
   * Update registration status
   * @param {string} memberId - Member ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated registration or null if not found
   */
  static async updateStatus(memberId, updateData) {
    const { status, hospital_guid, error_message } = updateData;
    
    let query = `
      UPDATE registration.patient_registry
      SET status = $1, updated_at = CURRENT_TIMESTAMP
    `;
    
    const values = [status];
    let paramCount = 2;
    
    if (hospital_guid) {
      query += `, hospital_guid = $${paramCount}`;
      values.push(hospital_guid);
      paramCount++;
    }
    
    if (status === 'registered') {
      query += `, registered_at = CURRENT_TIMESTAMP`;
    }
    
    if (error_message) {
      query += `, error_message = $${paramCount}`;
      values.push(error_message);
      paramCount++;
    }
    
    query += ` WHERE member_id = $${paramCount} RETURNING *`;
    values.push(memberId);
    
    const result = await db.query(query, values);
    
    // Create history record
    if (result.rows[0]) {
      await this.createHistoryRecord({
        member_id: memberId,
        hospital_guid: result.rows[0].hospital_guid,
        status,
        event_type: hospital_guid ? 'sync' : 'update',
        event_details: {
          ...(error_message ? { error_message } : {})
        }
      });
    }
    
    return result.rows[0] || null;
  }
  
  /**
   * Create a history record
   * @param {Object} historyData - History data
   * @returns {Promise<Object>} Created history record
   */
  static async createHistoryRecord(historyData) {
    const { 
      member_id, 
      hospital_guid, 
      status, 
      event_type, 
      event_details 
    } = historyData;
    
    const query = `
      INSERT INTO registration.registration_history (
        member_id, hospital_guid, status, event_type, event_details
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      member_id,
      hospital_guid,
      status,
      event_type,
      event_details || {}
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Get registration history for a member
   * @param {string} memberId - Member ID
   * @returns {Promise<Array>} Array of history records
   */
  static async getRegistrationHistory(memberId) {
    const query = `
      SELECT * FROM registration.registration_history
      WHERE member_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [memberId]);
    return result.rows;
  }
  
  /**
   * Find registrations by status
   * @param {string} status - Registration status
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Number of records to skip
   * @returns {Promise<Array>} Array of registrations
   */
  static async findByStatus(status, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM registration.patient_registry
      WHERE status = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [status, limit, offset]);
    return result.rows;
  }
  
  /**
   * Count registrations by status
   * @param {string} status - Registration status
   * @returns {Promise<number>} Count of registrations
   */
  static async countByStatus(status) {
    const query = `
      SELECT COUNT(*) FROM registration.patient_registry
      WHERE status = $1
    `;
    
    const result = await db.query(query, [status]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = RegistrationModel;
