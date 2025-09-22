const InvoiceModel = require('../models/invoiceModel');
const PaymentModel = require('../models/paymentModel');
const { ApiError } = require('../../../shared/error-handler');

class InvoiceController {
  /**
   * Create a new invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createInvoice(req, res, next) {
    try {
      const { invoice_data, items } = req.body;
      
      if (!invoice_data || !invoice_data.member_id) {
        throw new ApiError(400, 'Invoice data with member_id is required');
      }
      
      const invoice = await InvoiceModel.create(invoice_data, items);
      
      res.status(201).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get invoice by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getInvoice(req, res, next) {
    try {
      const { id } = req.params;
      
      const invoice = await InvoiceModel.findById(id);
      
      if (!invoice) {
        throw new ApiError(404, `Invoice not found with id ${id}`);
      }
      
      const payments = await PaymentModel.findByInvoiceId(id);
      
      res.status(200).json({
        success: true,
        data: {
          ...invoice,
          payments
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get invoices for a member
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getMemberInvoices(req, res, next) {
    try {
      const { memberId } = req.params;
      const limit = parseInt(req.query.limit) || 100;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      
      const invoices = await InvoiceModel.findByMemberId(memberId, { limit, offset });
      
      res.status(200).json({
        success: true,
        count: invoices.length,
        page,
        data: invoices
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get invoice for an appointment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAppointmentInvoice(req, res, next) {
    try {
      const { appointmentId } = req.params;
      
      const invoice = await InvoiceModel.findByAppointmentId(appointmentId);
      
      if (!invoice) {
        throw new ApiError(404, `No invoice found for appointment ${appointmentId}`);
      }
      
      const payments = await PaymentModel.findByInvoiceId(invoice.invoice_id);
      
      res.status(200).json({
        success: true,
        data: {
          ...invoice,
          payments
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update invoice status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updateInvoiceStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        throw new ApiError(400, 'Status is required');
      }
      
      const validStatuses = ['pending', 'paid', 'cancelled', 'refunded', 'partially_paid'];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Status must be one of: ${validStatuses.join(', ')}`);
      }
      
      const invoice = await InvoiceModel.updateStatus(id, status);
      
      if (!invoice) {
        throw new ApiError(404, `Invoice not found with id ${id}`);
      }
      
      res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get pending invoices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getPendingInvoices(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      
      const invoices = await InvoiceModel.findByStatus('pending', { limit, offset });
      const total = await InvoiceModel.countByStatus('pending');
      
      res.status(200).json({
        success: true,
        count: invoices.length,
        total,
        page,
        data: invoices
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get paid invoices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getPaidInvoices(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      
      const invoices = await InvoiceModel.findByStatus('paid', { limit, offset });
      const total = await InvoiceModel.countByStatus('paid');
      
      res.status(200).json({
        success: true,
        count: invoices.length,
        total,
        page,
        data: invoices
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Pay an invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async payInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const { payment_method, payment_details, amount } = req.body;
      
      const invoice = await InvoiceModel.findById(id);
      
      if (!invoice) {
        throw new ApiError(404, `Invoice not found with id ${id}`);
      }
      
      if (invoice.status === 'paid') {
        throw new ApiError(400, 'This invoice has already been paid');
      }
      
      const paymentAmount = amount || invoice.total_amount;
      
      
      const payment = await PaymentModel.create({
        invoice_id: id,
        member_id: invoice.member_id,
        amount: paymentAmount,
        currency: invoice.currency,
        payment_method,
        payment_status: 'succeeded',
        transaction_id: `manual-${Date.now()}`,
        payment_gateway: 'manual',
        gateway_response: payment_details || {},
        metadata: {
          payment_type: 'manual',
          paid_via: 'api'
        }
      });
      
      res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment recorded successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InvoiceController;
