const db = require('../../../shared/db');
const { v4: uuidv4 } = require('uuid');
const InvoiceModel = require('./invoiceModel');

/**
 * Payment Model - Handles database operations for payments
 */
class PaymentModel {
  /**
   * Create a new payment
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment
   */
  static async create(paymentData) {
    // Start a transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const { 
        invoice_id, 
        member_id, 
        amount, 
        currency = 'INR', 
        payment_method, 
        payment_status = 'pending',
        transaction_id,
        payment_gateway,
        gateway_response,
        metadata
      } = paymentData;
      
      // Generate payment ID
      const payment_id = uuidv4();
      
      const query = `
        INSERT INTO payment.payments (
          payment_id, invoice_id, member_id, amount, currency,
          payment_method, payment_status, transaction_id,
          payment_gateway, gateway_response, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        payment_id,
        invoice_id,
        member_id,
        amount,
        currency,
        payment_method,
        payment_status,
        transaction_id,
        payment_gateway,
        gateway_response || {},
        metadata || {}
      ];
      
      const result = await client.query(query, values);
      const payment = result.rows[0];
      
      // If payment is successful, update invoice status
      if (payment_status === 'succeeded' && invoice_id) {
        const invoice = await InvoiceModel.findById(invoice_id);
        
        if (invoice) {
          // If amount matches invoice total, mark as paid
          // Otherwise mark as partially paid
          const newStatus = amount >= invoice.total_amount ? 'paid' : 'partially_paid';
          await InvoiceModel.updateStatus(invoice_id, newStatus);
        }
      }
      
      await client.query('COMMIT');
      return payment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Find payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object|null>} Payment data or null if not found
   */
  static async findById(paymentId) {
    const query = `SELECT * FROM payment.payments WHERE payment_id = $1`;
    const result = await db.query(query, [paymentId]);
    return result.rows[0] || null;
  }
  
  /**
   * Update payment status
   * @param {string} paymentId - Payment ID
   * @param {string} status - New status
   * @param {Object} gatewayResponse - Payment gateway response
   * @returns {Promise<Object|null>} Updated payment or null if not found
   */
  static async updateStatus(paymentId, status, gatewayResponse = {}) {
    // Start a transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        UPDATE payment.payments
        SET payment_status = $1, gateway_response = $2, updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = $3
        RETURNING *
      `;
      
      const result = await client.query(query, [status, gatewayResponse, paymentId]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      const payment = result.rows[0];
      
      // If payment is successful, update invoice status
      if (status === 'succeeded' && payment.invoice_id) {
        const invoice = await InvoiceModel.findById(payment.invoice_id);
        
        if (invoice) {
          // Get all successful payments for this invoice
          const paymentsQuery = `
            SELECT SUM(amount) as total_paid
            FROM payment.payments
            WHERE invoice_id = $1 AND payment_status = 'succeeded'
          `;
          
          const paymentsResult = await client.query(paymentsQuery, [payment.invoice_id]);
          const totalPaid = parseFloat(paymentsResult.rows[0].total_paid) || 0;
          
          // If total paid matches or exceeds invoice total, mark as paid
          // Otherwise mark as partially paid
          const newStatus = totalPaid >= invoice.total_amount ? 'paid' : 'partially_paid';
          await client.query(
            'UPDATE payment.invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE invoice_id = $2',
            [newStatus, payment.invoice_id]
          );
        }
      }
      
      await client.query('COMMIT');
      return payment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Find payments by invoice ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Array>} Array of payments
   */
  static async findByInvoiceId(invoiceId) {
    const query = `
      SELECT * FROM payment.payments
      WHERE invoice_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [invoiceId]);
    return result.rows;
  }
  
  /**
   * Find payments by member ID
   * @param {string} memberId - Member ID
   * @param {Object} options - Query options
   * @param {number} [options.limit=100] - Maximum number of records to return
   * @param {number} [options.offset=0] - Number of records to skip
   * @returns {Promise<Array>} Array of payments
   */
  static async findByMemberId(memberId, options = {}) {
    const { limit = 100, offset = 0 } = options;
    
    const query = `
      SELECT * FROM payment.payments
      WHERE member_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [memberId, limit, offset]);
    return result.rows;
  }
  
  /**
   * Create a refund
   * @param {Object} refundData - Refund data
   * @returns {Promise<Object>} Created refund
   */
  static async createRefund(refundData) {
    // Start a transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const { 
        payment_id, 
        amount, 
        reason, 
        status = 'pending',
        transaction_id,
        gateway_response,
        metadata
      } = refundData;
      
      // Generate refund ID
      const refund_id = uuidv4();
      
      const query = `
        INSERT INTO payment.refunds (
          refund_id, payment_id, amount, reason,
          status, transaction_id, gateway_response, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        refund_id,
        payment_id,
        amount,
        reason,
        status,
        transaction_id,
        gateway_response || {},
        metadata || {}
      ];
      
      const result = await client.query(query, values);
      const refund = result.rows[0];
      
      // Update payment record with refund ID
      await client.query(
        'UPDATE payment.payments SET refund_id = $1, updated_at = CURRENT_TIMESTAMP WHERE payment_id = $2',
        [refund_id, payment_id]
      );
      
      // If refund is successful, update payment status and potentially invoice status
      if (status === 'succeeded') {
        // Update payment status
        const paymentQuery = `
          UPDATE payment.payments
          SET payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP
          WHERE payment_id = $1
          RETURNING invoice_id
        `;
        
        const paymentResult = await client.query(paymentQuery, [payment_id]);
        
        // If payment is associated with an invoice
        if (paymentResult.rows.length > 0 && paymentResult.rows[0].invoice_id) {
          const invoiceId = paymentResult.rows[0].invoice_id;
          
          // Update invoice status to reflect refund
          await client.query(
            'UPDATE payment.invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE invoice_id = $2',
            ['refunded', invoiceId]
          );
        }
      }
      
      await client.query('COMMIT');
      return refund;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Find refund by ID
   * @param {string} refundId - Refund ID
   * @returns {Promise<Object|null>} Refund data or null if not found
   */
  static async findRefundById(refundId) {
    const query = `SELECT * FROM payment.refunds WHERE refund_id = $1`;
    const result = await db.query(query, [refundId]);
    return result.rows[0] || null;
  }
  
  /**
   * Find refunds by payment ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Array>} Array of refunds
   */
  static async findRefundsByPaymentId(paymentId) {
    const query = `
      SELECT * FROM payment.refunds
      WHERE payment_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [paymentId]);
    return result.rows;
  }
}

module.exports = PaymentModel;
