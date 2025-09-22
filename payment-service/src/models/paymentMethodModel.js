const db = require('../../../shared/db');
const { v4: uuidv4 } = require('uuid');

/**
 * PaymentMethod Model - Handles database operations for stored payment methods
 */
class PaymentMethodModel {
  /**
   * Create a new payment method
   * @param {Object} paymentMethodData - Payment method data
   * @returns {Promise<Object>} Created payment method
   */
  static async create(paymentMethodData) {
    // Start a transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const { 
        member_id, 
        type, 
        provider, 
        last_four, 
        expiry_month, 
        expiry_year, 
        token,
        is_default = false,
        metadata
      } = paymentMethodData;
      
      // Generate payment method ID
      const payment_method_id = uuidv4();
      
      // If this method is being set as default, remove default flag from other methods
      if (is_default) {
        await client.query(
          'UPDATE payment.payment_methods SET is_default = false WHERE member_id = $1',
          [member_id]
        );
      }
      
      const query = `
        INSERT INTO payment.payment_methods (
          payment_method_id, member_id, type, provider,
          last_four, expiry_month, expiry_year, token,
          is_default, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        payment_method_id,
        member_id,
        type,
        provider,
        last_four,
        expiry_month,
        expiry_year,
        token,
        is_default,
        metadata || {}
      ];
      
      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Find payment method by ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object|null>} Payment method data or null if not found
   */
  static async findById(paymentMethodId) {
    const query = `SELECT * FROM payment.payment_methods WHERE payment_method_id = $1`;
    const result = await db.query(query, [paymentMethodId]);
    return result.rows[0] || null;
  }
  
  /**
   * Find payment methods by member ID
   * @param {string} memberId - Member ID
   * @returns {Promise<Array>} Array of payment methods
   */
  static async findByMemberId(memberId) {
    const query = `
      SELECT * FROM payment.payment_methods
      WHERE member_id = $1
      ORDER BY is_default DESC, created_at DESC
    `;
    
    const result = await db.query(query, [memberId]);
    return result.rows;
  }
  
  /**
   * Get default payment method for member
   * @param {string} memberId - Member ID
   * @returns {Promise<Object|null>} Default payment method or null if not found
   */
  static async getDefaultMethod(memberId) {
    const query = `
      SELECT * FROM payment.payment_methods
      WHERE member_id = $1 AND is_default = true
      LIMIT 1
    `;
    
    const result = await db.query(query, [memberId]);
    return result.rows[0] || null;
  }
  
  /**
   * Set payment method as default
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object|null>} Updated payment method or null if not found
   */
  static async setAsDefault(paymentMethodId) {
    // Start a transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get the member ID for this payment method
      const getMethodQuery = `
        SELECT member_id FROM payment.payment_methods
        WHERE payment_method_id = $1
      `;
      
      const methodResult = await client.query(getMethodQuery, [paymentMethodId]);
      
      if (methodResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      const memberId = methodResult.rows[0].member_id;
      
      // Remove default flag from all payment methods for this member
      await client.query(
        'UPDATE payment.payment_methods SET is_default = false WHERE member_id = $1',
        [memberId]
      );
      
      // Set the specified payment method as default
      const query = `
        UPDATE payment.payment_methods
        SET is_default = true, updated_at = CURRENT_TIMESTAMP
        WHERE payment_method_id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [paymentMethodId]);
      
      await client.query('COMMIT');
      return result.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Delete payment method
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(paymentMethodId) {
    // Start a transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Check if this is a default payment method
      const getMethodQuery = `
        SELECT member_id, is_default FROM payment.payment_methods
        WHERE payment_method_id = $1
      `;
      
      const methodResult = await client.query(getMethodQuery, [paymentMethodId]);
      
      if (methodResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      
      const { member_id, is_default } = methodResult.rows[0];
      
      // Delete the payment method
      const deleteQuery = `
        DELETE FROM payment.payment_methods
        WHERE payment_method_id = $1
        RETURNING payment_method_id
      `;
      
      const deleteResult = await client.query(deleteQuery, [paymentMethodId]);
      
      // If it was the default method, set a new default if possible
      if (is_default) {
        const findNextQuery = `
          SELECT payment_method_id FROM payment.payment_methods
          WHERE member_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        const nextResult = await client.query(findNextQuery, [member_id]);
        
        if (nextResult.rows.length > 0) {
          // Set the next payment method as default
          await client.query(
            'UPDATE payment.payment_methods SET is_default = true WHERE payment_method_id = $1',
            [nextResult.rows[0].payment_method_id]
          );
        }
      }
      
      await client.query('COMMIT');
      return deleteResult.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = PaymentMethodModel;
