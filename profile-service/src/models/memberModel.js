const db = require('../../../shared/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Member Model - Handles database operations for family members
 */
class MemberModel {
  /**
   * Create a new member record
   * @param {Object} memberData - Member data
   * @returns {Promise<Object>} Created member
   */
  static async create(memberData) {
    const { 
      user_id, 
      name, 
      dob, 
      gender, 
      phone, 
      email, 
      address, 
      relation_to_user, 
      emergency_contact,
      hospital_guid,
      profile_completed
    } = memberData;
    
    // Generate a UUID for the member
    const member_id = uuidv4();
    
    const query = `
      INSERT INTO profile.members (
        member_id, user_id, name, dob, gender, phone, email, 
        address, relation_to_user, emergency_contact, 
        hospital_guid, profile_completed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      member_id, 
      user_id, 
      name, 
      dob, 
      gender, 
      phone, 
      email, 
      address || {}, 
      relation_to_user, 
      emergency_contact || {},
      hospital_guid,
      profile_completed || false
    ];
    
    const result = await db.query(query, values);
    
    // Create the user-member link
    await this.createLink({
      user_id,
      member_id,
      relationship_type: relation_to_user || 'self',
      is_primary: true,
      has_access_rights: true
    });
    
    return result.rows[0];
  }
  
  /**
   * Create a link between user and member
   * @param {Object} linkData - Link data
   * @returns {Promise<Object>} Created link
   */
  static async createLink(linkData) {
    const { user_id, member_id, relationship_type, is_primary, has_access_rights } = linkData;
    
    const query = `
      INSERT INTO profile.user_member_links (
        user_id, member_id, relationship_type, is_primary, has_access_rights
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, member_id) DO UPDATE
      SET relationship_type = $3,
          is_primary = $4,
          has_access_rights = $5,
          updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [
      user_id,
      member_id,
      relationship_type,
      is_primary,
      has_access_rights
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Find all members for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of members
   */
  static async findByUserId(userId) {
    const query = `
      SELECT m.*, l.relationship_type, l.is_primary, l.has_access_rights 
      FROM profile.members m
      JOIN profile.user_member_links l ON m.member_id = l.member_id
      WHERE l.user_id = $1
      ORDER BY l.is_primary DESC, m.created_at ASC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }
  
  /**
   * Find a member by ID
   * @param {string} memberId - Member ID
   * @returns {Promise<Object|null>} Member data or null if not found
   */
  static async findById(memberId) {
    const query = `SELECT * FROM profile.members WHERE member_id = $1`;
    const result = await db.query(query, [memberId]);
    return result.rows[0] || null;
  }
  
  /**
   * Find a member by phone number
   * @param {string} phone - Phone number
   * @returns {Promise<Object|null>} Member data or null if not found
   */
  static async findByPhone(phone) {
    const query = `SELECT * FROM profile.members WHERE phone = $1`;
    const result = await db.query(query, [phone]);
    return result.rows[0] || null;
  }
  
  /**
   * Find a member by hospital GUID
   * @param {string} hospitalGuid - Hospital GUID
   * @returns {Promise<Object|null>} Member data or null if not found
   */
  static async findByHospitalGuid(hospitalGuid) {
    const query = `SELECT * FROM profile.members WHERE hospital_guid = $1`;
    const result = await db.query(query, [hospitalGuid]);
    return result.rows[0] || null;
  }
  
  /**
   * Update a member by ID
   * @param {string} memberId - Member ID
   * @param {Object} memberData - Updated member data
   * @returns {Promise<Object|null>} Updated member or null if not found
   */
  static async update(memberId, memberData) {
    // Extract only the fields that are provided
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(memberData)) {
      if (value !== undefined && [
        'name', 'dob', 'gender', 'phone', 'email', 'address',
        'relation_to_user', 'emergency_contact', 'hospital_guid', 'profile_completed'
      ].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (fields.length === 0) {
      return null; // No fields to update
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    values.push(memberId); // Add ID as the last parameter
    
    const query = `
      UPDATE profile.members
      SET ${fields.join(', ')}
      WHERE member_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete a member by ID
   * @param {string} memberId - Member ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(memberId) {
    const query = `DELETE FROM profile.members WHERE member_id = $1 RETURNING member_id`;
    const result = await db.query(query, [memberId]);
    return result.rowCount > 0;
  }
  
  /**
   * Link an existing member to a user
   * @param {string} memberId - Member ID
   * @param {string} userId - User ID
   * @param {string} relationshipType - Relationship type
   * @returns {Promise<Object>} Created link
   */
  static async linkExistingMember(memberId, userId, relationshipType) {
    // Check if member exists
    const member = await this.findById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }
    
    // Create the link
    return await this.createLink({
      user_id: userId,
      member_id: memberId,
      relationship_type: relationshipType,
      is_primary: false,
      has_access_rights: true
    });
  }
  
  /**
   * Check if a user has access to a member
   * @param {string} userId - User ID
   * @param {string} memberId - Member ID
   * @returns {Promise<boolean>} True if user has access, false otherwise
   */
  static async checkAccess(userId, memberId) {
    const query = `
      SELECT COUNT(*) FROM profile.user_member_links
      WHERE user_id = $1 AND member_id = $2 AND has_access_rights = true
    `;
    
    const result = await db.query(query, [userId, memberId]);
    return parseInt(result.rows[0].count) > 0;
  }
}

module.exports = MemberModel;
