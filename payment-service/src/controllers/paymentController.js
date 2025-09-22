const PaymentModel = require('../models/paymentModel');
const InvoiceModel = require('../models/invoiceModel');
const PaymentMethodModel = require('../models/paymentMethodModel');
const PaymentGatewayService = require('../services/paymentGatewayService');
const { ApiError } = require('../../../shared/error-handler');
const logger = require('../utils/logger');
class PaymentController {
  /**
   * Create a payment intent
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createPaymentIntent(req, res, next) {
    try {
      const { invoice_id, payment_method_id = 'card', amount } = req.body;
      logger.info('info', `Create Payment Intent called with invoice_id: ${invoice_id}, payment_method_id: ${payment_method_id}, amount: ${amount}`);
      let invoice = null;
      let paymentAmount = amount;
      if (invoice_id) {
        invoice = await InvoiceModel.findById(invoice_id);
        
        if (!invoice) {
          throw new ApiError(404, `Invoice not found with id ${invoice_id}`);
        }
        
        paymentAmount = amount || invoice.total_amount;
        
        if (invoice.status === 'paid') {
          throw new ApiError(400, 'This invoice has already been paid');
        }
      } else if (!amount) {
        throw new ApiError(400, 'Either invoice_id or amount is required');
      }
      
      const paymentIntent = await PaymentGatewayService.createPaymentIntent({
        amount: paymentAmount,
        currency: invoice ? invoice.currency : 'INR',
        description: invoice ? `Payment for invoice ${invoice.invoice_number}` : 'Payment',
        member_id: invoice ? invoice.member_id : req.body.member_id,
        metadata: {
          invoice_id: invoice_id || null,
          appointment_id: invoice ? invoice.appointment_id : null
        }
      });
      
      res.status(200).json({
        success: true,
        data: paymentIntent
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Process a payment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async processPayment(req, res, next) {
    try {
      const { 
        payment_intent_id, 
        invoice_id, 
        member_id, 
        payment_method, 
        amount, 
        currency = 'INR' 
      } = req.body;
      
      if (!payment_intent_id) {
        throw new ApiError(400, 'Payment intent ID is required');
      }
      
      if (!member_id) {
        throw new ApiError(400, 'Member ID is required');
      }
      
      const paymentIntentStatus = await PaymentGatewayService.retrievePaymentIntent(payment_intent_id);
      
      if (paymentIntentStatus.status !== 'succeeded') {
        throw new ApiError(400, `Payment was not successful. Status: ${paymentIntentStatus.status}`);
      }
      
      const payment = await PaymentModel.create({
        invoice_id,
        member_id,
        amount: amount || paymentIntentStatus.amount,
        currency: currency || paymentIntentStatus.currency,
        payment_method,
        payment_status: 'succeeded',
        transaction_id: payment_intent_id,
        payment_gateway: 'stripe',
        gateway_response: paymentIntentStatus.gateway_response
      });
      
      res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment processed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Process a webhook event from payment gateway
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} _next - Express next middleware function
   */
  static async processWebhook(req, res, next) {
    try {
      const signature = req.headers['stripe-signature'];
      
      if (!signature) {
        throw new ApiError(400, 'Missing stripe-signature header');
      }
      
      const event = await PaymentGatewayService.processWebhook(
        req.rawBody, // Raw request body
        signature
      );
      
      let result;
      
      switch (event.type) {
        case 'payment.succeeded':
          result = await PaymentController._handleSuccessfulPayment(event.data);
          break;
          
        case 'payment.failed':
          result = await PaymentController._handleFailedPayment(event.data);
          break;
          
        case 'payment.refunded':
          result = await PaymentController._handleRefund(event.data);
          break;
          
        default:
          logger.info(`Received unknown webhook event type: ${event.type}`);
      }
      
      res.status(200).json({ received: true, result });
    } catch (error) {
      logger.error('Webhook processing error:', error);
      res.status(400).json({ error: error.message });
      next(error);
    }
  }
  
  /**
   * Get payment details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getPayment(req, res, next) {
    try {
      const { id } = req.params;
      
      const payment = await PaymentModel.findById(id);
      
      if (!payment) {
        throw new ApiError(404, `Payment not found with id ${id}`);
      }
      
      const refunds = await PaymentModel.findRefundsByPaymentId(id);
      
      res.status(200).json({
        success: true,
        data: {
          ...payment,
          refunds
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create a refund
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createRefund(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      
      // Find the payment
      const payment = await PaymentModel.findById(id);
      
      if (!payment) {
        throw new ApiError(404, `Payment not found with id ${id}`);
      }
      
      if (payment.payment_status !== 'succeeded') {
        throw new ApiError(400, 'Cannot refund a payment that has not succeeded');
      }
      
      if (payment.payment_status === 'refunded') {
        throw new ApiError(400, 'This payment has already been refunded');
      }
      
      const refundResult = await PaymentGatewayService.createRefund({
        payment_intent_id: payment.transaction_id,
        amount: amount || payment.amount,
        reason
      });
      
      const refund = await PaymentModel.createRefund({
        payment_id: id,
        amount: amount || payment.amount,
        reason,
        status: refundResult.status,
        transaction_id: refundResult.id,
        gateway_response: refundResult.gateway_response
      });
      
      res.status(200).json({
        success: true,
        data: refund,
        message: 'Refund initiated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get member payments
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getMemberPayments(req, res, next) {
    try {
      const { memberId } = req.params;
      const limit = parseInt(req.query.limit) || 100;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      
      const payments = await PaymentModel.findByMemberId(memberId, { limit, offset });
      
      res.status(200).json({
        success: true,
        count: payments.length,
        page,
        data: payments
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Add a payment method
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async addPaymentMethod(req, res, next) {
    try {
      const { member_id, token, card_details, is_default } = req.body;
      
      if (!member_id) {
        throw new ApiError(400, 'Member ID is required');
      }
      
      if (!token && !card_details) {
        throw new ApiError(400, 'Either token or card_details is required');
      }
      
      let paymentMethod;
      let tokenData = token;
      
      if (card_details) {
        const result = await PaymentGatewayService.createPaymentMethod(card_details);
        tokenData = result.id;
        
        paymentMethod = await PaymentMethodModel.create({
          member_id,
          type: result.type,
          provider: result.card.brand,
          last_four: result.card.last4,
          expiry_month: result.card.exp_month,
          expiry_year: result.card.exp_year,
          token: tokenData,
          is_default: is_default !== undefined ? is_default : true
        });
      } else {
        const { type, provider, last_four, expiry_month, expiry_year } = req.body;
        
        if (!type || !provider || !last_four) {
          throw new ApiError(400, 'Payment method details are required when using a token');
        }
        
        paymentMethod = await PaymentMethodModel.create({
          member_id,
          type,
          provider,
          last_four,
          expiry_month,
          expiry_year,
          token: tokenData,
          is_default: is_default !== undefined ? is_default : true
        });
      }
      
      res.status(201).json({
        success: true,
        data: paymentMethod
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get member payment methods
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getMemberPaymentMethods(req, res, next) {
    try {
      const { memberId } = req.params;
      
      const paymentMethods = await PaymentMethodModel.findByMemberId(memberId);
      
      res.status(200).json({
        success: true,
        count: paymentMethods.length,
        data: paymentMethods
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Delete payment method
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deletePaymentMethod(req, res, next) {
    try {
      const { id } = req.params;
      
      const deleted = await PaymentMethodModel.delete(id);
      
      if (!deleted) {
        throw new ApiError(404, `Payment method not found with id ${id}`);
      }
      
      res.status(200).json({
        success: true,
        message: 'Payment method deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handle successful payment webhook
   * @param {Object} data - Payment data from webhook
   * @private
   */
  static async _handleSuccessfulPayment(data) {
    try {
      const { payment_intent_id, amount, currency, metadata } = data;
      
      // Check if this payment intent has already been processed
            const existingPayment = await PaymentModel.findOne({
        where: { transaction_id: payment_intent_id }
      });
      
      if (existingPayment.rows.length > 0) {
        // Already processed, no need to do anything
        return { status: 'already_processed', payment_id: existingPayment.rows[0].payment_id };
      }
      
      // Get member_id and invoice_id from metadata
      const { member_id, invoice_id } = metadata || {};
      
      if (!member_id) {
        return { status: 'error', message: 'Missing member_id in payment metadata' };
      }
      
      const payment = await PaymentModel.create({
        invoice_id,
        member_id,
        amount,
        currency,
        payment_method: 'card', // Assuming Stripe
        payment_status: 'succeeded',
        transaction_id: payment_intent_id,
        payment_gateway: 'stripe',
        gateway_response: data
      });
      
      return {
        status: 'success',
        payment_id: payment.payment_id
      };
    } catch (error) {
      console.error('Error handling successful payment webhook:', error);
      return { status: 'error', message: error.message };
    }
  }
  
  /**
   * Handle failed payment webhook
   * @param {Object} data - Payment data from webhook
   * @private
   */
  static async _handleFailedPayment(data) {
    try {
      const { payment_intent_id, metadata, error } = data;
      
      // Get member_id and invoice_id from metadata
      const { member_id, invoice_id } = metadata || {};
      
      if (!member_id) {
        return { status: 'error', message: 'Missing member_id in payment metadata' };
      }
      
      // Create a failed payment record
      const payment = await PaymentModel.create({
        invoice_id,
        member_id,
        amount: data.amount,
        currency: data.currency,
        payment_method: 'card', // Assuming Stripe
        payment_status: 'failed',
        transaction_id: payment_intent_id,
        payment_gateway: 'stripe',
        gateway_response: {
          ...data,
          failure_reason: error
        }
      });
      
      return {
        status: 'recorded_failure',
        payment_id: payment.payment_id
      };
    } catch (error) {
      console.error('Error handling failed payment webhook:', error);
      return { status: 'error', message: error.message };
    }
  }
  
  /**
   * Handle refund webhook
   * @param {Object} data - Refund data from webhook
   * @private
   */
  static async _handleRefund(data) {
    try {
      const { payment_intent_id, refund_id, amount } = data;
      
         const paymentResult = await PaymentModel.findOne({
        where: { transaction_id: payment_intent_id }
      });
      
      if (paymentResult.rows.length === 0) {
        return { status: 'error', message: 'Original payment not found' };
      }
      
      const payment = paymentResult.rows[0];
      
      // Check if this refund has already been processed
      const existingRefund = await PaymentModel.findRefundBy({ transaction_id: refund_id });

      
      if (existingRefund.rows.length > 0) {
        // Already processed, no need to do anything
        return { status: 'already_processed', refund_id: existingRefund.rows[0].refund_id };
      }
      
      // Create a refund record
      const refund = await PaymentModel.createRefund({
        payment_id: payment.payment_id,
        amount,
        reason: 'webhook_notification',
        status: 'succeeded',
        transaction_id: refund_id,
        gateway_response: data
      });
      
      return {
        status: 'success',
        refund_id: refund.refund_id
      };
    } catch (error) {
      logger.error('Error handling refund webhook:', error);
      return { status: 'error', message: error.message };
    }
  }
}

module.exports = PaymentController;
