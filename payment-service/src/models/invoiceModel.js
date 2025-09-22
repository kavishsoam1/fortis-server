const db = require('../../../shared/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Invoice Model - Handles database operations for invoices
 */
class InvoiceModel {
  /**
   * Generate a unique invoice number
   * @returns {Promise<string>} Generated invoice number
   */
  static async generateInvoiceNumber() {
    const prefix = 'INV';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get the count of invoices created today to use as a sequence
    const query = `
      SELECT COUNT(*) as count FROM payment.invoices
      WHERE created_at::date = CURRENT_DATE
    `;
    
    const result = await db.query(query);
    const count = parseInt(result.rows[0].count) + 1;
    
    // Format the sequence number to be 4 digits with leading zeros
    const sequence = count.toString().padStart(4, '0');
    
    return `${prefix}-${date}-${sequence}`;
  }
  
  /**
   * Create a new invoice
   * @param {Object} invoiceData - Invoice data
   * @param {Array} items - Array of invoice items
   * @returns {Promise<Object>} Created invoice with items
   */
  static async create(invoiceData, items = []) {
    // Start a transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Generate invoice ID and invoice number
      const invoice_id = uuidv4();
      const invoice_number = await this.generateInvoiceNumber();
      
      // Calculate totals from items if provided
      let subTotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;
      
      if (items && items.length > 0) {
        items.forEach(item => {
          subTotal += (item.unit_price * item.quantity);
          totalTax += (item.tax_amount || 0);
          totalDiscount += (item.discount_amount || 0);
        });
      } else {
        // Use provided values if no items
        subTotal = invoiceData.amount || 0;
        totalTax = invoiceData.tax_amount || 0;
        totalDiscount = invoiceData.discount_amount || 0;
      }
      
      // Calculate total amount
      const totalAmount = subTotal + totalTax - totalDiscount;
      
      const { 
        member_id, 
        hospital_guid, 
        appointment_id, 
        due_date, 
        notes, 
        metadata,
        currency = 'INR'
      } = invoiceData;
      
      // Create the invoice
      const invoiceQuery = `
        INSERT INTO payment.invoices (
          invoice_id, member_id, hospital_guid, appointment_id, 
          invoice_number, amount, tax_amount, discount_amount,
          total_amount, currency, due_date, notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      
      const invoiceValues = [
        invoice_id,
        member_id,
        hospital_guid,
        appointment_id,
        invoice_number,
        subTotal,
        totalTax,
        totalDiscount,
        totalAmount,
        currency,
        due_date,
        notes,
        metadata || {}
      ];
      
      const invoiceResult = await client.query(invoiceQuery, invoiceValues);
      const invoice = invoiceResult.rows[0];
      
      // Add invoice items if provided
      const createdItems = [];
      if (items && items.length > 0) {
        for (const item of items) {
          const itemQuery = `
            INSERT INTO payment.invoice_items (
              invoice_id, description, quantity, unit_price,
              discount_amount, tax_amount, total_amount,
              item_type, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
          `;
          
          const itemTotal = (item.unit_price * item.quantity) + 
                          (item.tax_amount || 0) - 
                          (item.discount_amount || 0);
          
          const itemValues = [
            invoice_id,
            item.description,
            item.quantity,
            item.unit_price,
            item.discount_amount || 0,
            item.tax_amount || 0,
            itemTotal,
            item.item_type,
            item.metadata || {}
          ];
          
          const itemResult = await client.query(itemQuery, itemValues);
          createdItems.push(itemResult.rows[0]);
        }
      }
      
      await client.query('COMMIT');
      
      return {
        ...invoice,
        items: createdItems
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Find invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object|null>} Invoice data with items or null if not found
   */
  static async findById(invoiceId) {
    // Get invoice details
    const invoiceQuery = `SELECT * FROM payment.invoices WHERE invoice_id = $1`;
    const invoiceResult = await db.query(invoiceQuery, [invoiceId]);
    
    if (invoiceResult.rows.length === 0) {
      return null;
    }
    
    const invoice = invoiceResult.rows[0];
    
    // Get invoice items
    const itemsQuery = `SELECT * FROM payment.invoice_items WHERE invoice_id = $1`;
    const itemsResult = await db.query(itemsQuery, [invoiceId]);
    
    return {
      ...invoice,
      items: itemsResult.rows
    };
  }
  
  /**
   * Find invoices by member ID
   * @param {string} memberId - Member ID
   * @param {Object} options - Query options
   * @param {number} [options.limit=100] - Maximum number of records to return
   * @param {number} [options.offset=0] - Number of records to skip
   * @returns {Promise<Array>} Array of invoices
   */
  static async findByMemberId(memberId, options = {}) {
    const { limit = 100, offset = 0 } = options;
    
    const query = `
      SELECT * FROM payment.invoices
      WHERE member_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [memberId, limit, offset]);
    return result.rows;
  }
  
  /**
   * Find invoice by appointment ID
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object|null>} Invoice data or null if not found
   */
  static async findByAppointmentId(appointmentId) {
    const query = `
      SELECT * FROM payment.invoices
      WHERE appointment_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [appointmentId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const invoice = result.rows[0];
    
    // Get invoice items
    const itemsQuery = `SELECT * FROM payment.invoice_items WHERE invoice_id = $1`;
    const itemsResult = await db.query(itemsQuery, [invoice.invoice_id]);
    
    return {
      ...invoice,
      items: itemsResult.rows
    };
  }
  
  /**
   * Update invoice status
   * @param {string} invoiceId - Invoice ID
   * @param {string} status - New status
   * @returns {Promise<Object|null>} Updated invoice or null if not found
   */
  static async updateStatus(invoiceId, status) {
    const query = `
      UPDATE payment.invoices
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [status, invoiceId]);
    return result.rows[0] || null;
  }
  
  /**
   * Get invoices by status
   * @param {string} status - Invoice status
   * @param {Object} options - Query options
   * @param {number} [options.limit=100] - Maximum number of records to return
   * @param {number} [options.offset=0] - Number of records to skip
   * @returns {Promise<Array>} Array of invoices
   */
  static async findByStatus(status, options = {}) {
    const { limit = 100, offset = 0 } = options;
    
    const query = `
      SELECT * FROM payment.invoices
      WHERE status = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [status, limit, offset]);
    return result.rows;
  }
  
  /**
   * Count invoices by status
   * @param {string} status - Invoice status
   * @returns {Promise<number>} Count of invoices
   */
  static async countByStatus(status) {
    const query = `
      SELECT COUNT(*) FROM payment.invoices
      WHERE status = $1
    `;
    
    const result = await db.query(query, [status]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = InvoiceModel;
