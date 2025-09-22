const db = require('../../../shared/db');

/**
 * Department Model - Handles database operations for departments
 */
class DepartmentModel {
  /**
   * Create a new department
   * @param {Object} departmentData - Department data
   * @returns {Promise<Object>} Created department
   */
  static async create(departmentData) {
    const { name, description, is_active } = departmentData;
    
    const query = `
      INSERT INTO doctor.departments (
        name, description, is_active
      ) VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [
      name,
      description,
      is_active !== undefined ? is_active : true
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Get all departments
   * @param {boolean} activeOnly - If true, return only active departments
   * @returns {Promise<Array>} Array of departments
   */
  static async findAll(activeOnly = true) {
    let query = `
      SELECT * FROM doctor.departments
    `;
    
    if (activeOnly) {
      query += ` WHERE is_active = true`;
    }
    
    query += ` ORDER BY name ASC`;
    
    const result = await db.query(query);
    return result.rows;
  }
  
  /**
   * Get department by ID
   * @param {number} id - Department ID
   * @returns {Promise<Object|null>} Department or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT * FROM doctor.departments
      WHERE department_id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Update department
   * @param {number} id - Department ID
   * @param {Object} departmentData - Department data to update
   * @returns {Promise<Object|null>} Updated department or null if not found
   */
  static async update(id, departmentData) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(departmentData)) {
      if (value !== undefined && ['name', 'description', 'is_active'].includes(key)) {
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
      UPDATE doctor.departments
      SET ${fields.join(', ')}
      WHERE department_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Get doctors in a department
   * @param {number} departmentId - Department ID
   * @param {boolean} activeOnly - If true, return only active doctors
   * @returns {Promise<Array>} Array of doctors
   */
  static async getDoctors(departmentId, activeOnly = true) {
    let query = `
      SELECT d.*,
        s.name as specialty_name,
        dp.name as department_name
      FROM doctor.doctors d
      LEFT JOIN doctor.specialties s ON d.specialty_id = s.specialty_id
      JOIN doctor.departments dp ON d.department_id = dp.department_id
      WHERE d.department_id = $1
    `;
    
    if (activeOnly) {
      query += ` AND d.is_active = true`;
    }
    
    query += ` ORDER BY d.first_name, d.last_name ASC`;
    
    const result = await db.query(query, [departmentId]);
    return result.rows;
  }
  
  /**
   * Get specialties in a department
   * @param {number} departmentId - Department ID
   * @param {boolean} activeOnly - If true, return only active specialties
   * @returns {Promise<Array>} Array of specialties
   */
  static async getSpecialties(departmentId, activeOnly = true) {
    let query = `
      SELECT * FROM doctor.specialties
      WHERE department_id = $1
    `;
    
    if (activeOnly) {
      query += ` AND is_active = true`;
    }
    
    query += ` ORDER BY name ASC`;
    
    const result = await db.query(query, [departmentId]);
    return result.rows;
  }
}

module.exports = DepartmentModel;
