const db = require('../../../shared/db');

/**
 * Specialty Model - Handles database operations for specialties
 */
class SpecialtyModel {
  /**
   * Create a new specialty
   * @param {Object} specialtyData - Specialty data
   * @returns {Promise<Object>} Created specialty
   */
  static async create(specialtyData) {
    const { name, description, department_id, is_active } = specialtyData;
    
    const query = `
      INSERT INTO doctor.specialties (
        name, description, department_id, is_active
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      name,
      description,
      department_id,
      is_active !== undefined ? is_active : true
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Get all specialties
   * @param {boolean} activeOnly - If true, return only active specialties
   * @returns {Promise<Array>} Array of specialties
   */
  static async findAll(activeOnly = true) {
    let query = `
      SELECT s.*, d.name as department_name
      FROM doctor.specialties s
      LEFT JOIN doctor.departments d ON s.department_id = d.department_id
    `;
    
    if (activeOnly) {
      query += ` WHERE s.is_active = true`;
    }
    
    query += ` ORDER BY s.name ASC`;
    
    const result = await db.query(query);
    return result.rows;
  }
  
  /**
   * Get specialty by ID
   * @param {number} id - Specialty ID
   * @returns {Promise<Object|null>} Specialty or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT s.*, d.name as department_name
      FROM doctor.specialties s
      LEFT JOIN doctor.departments d ON s.department_id = d.department_id
      WHERE s.specialty_id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find specialties by name (partial match)
   * @param {string} name - Specialty name to search for
   * @param {boolean} activeOnly - If true, return only active specialties
   * @returns {Promise<Array>} Array of matching specialties
   */
  static async findByName(name, activeOnly = true) {
    let query = `
      SELECT s.*, d.name as department_name
      FROM doctor.specialties s
      LEFT JOIN doctor.departments d ON s.department_id = d.department_id
      WHERE s.name ILIKE $1
    `;
    
    if (activeOnly) {
      query += ` AND s.is_active = true`;
    }
    
    query += ` ORDER BY s.name ASC`;
    
    const result = await db.query(query, [`%${name}%`]);
    return result.rows;
  }
  
  /**
   * Update specialty
   * @param {number} id - Specialty ID
   * @param {Object} specialtyData - Specialty data to update
   * @returns {Promise<Object|null>} Updated specialty or null if not found
   */
  static async update(id, specialtyData) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(specialtyData)) {
      if (value !== undefined && ['name', 'description', 'department_id', 'is_active'].includes(key)) {
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
      UPDATE doctor.specialties
      SET ${fields.join(', ')}
      WHERE specialty_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Get doctors with a specific specialty
   * @param {number} specialtyId - Specialty ID
   * @param {boolean} activeOnly - If true, return only active doctors
   * @returns {Promise<Array>} Array of doctors
   */
  static async getDoctors(specialtyId, activeOnly = true) {
    let query = `
      SELECT d.*,
        s.name as specialty_name,
        dp.name as department_name
      FROM doctor.doctors d
      JOIN doctor.specialties s ON d.specialty_id = s.specialty_id
      LEFT JOIN doctor.departments dp ON d.department_id = dp.department_id
      WHERE d.specialty_id = $1
    `;
    
    if (activeOnly) {
      query += ` AND d.is_active = true`;
    }
    
    query += ` ORDER BY d.years_of_experience DESC, d.first_name, d.last_name ASC`;
    
    const result = await db.query(query, [specialtyId]);
    return result.rows;
  }
}

module.exports = SpecialtyModel;
