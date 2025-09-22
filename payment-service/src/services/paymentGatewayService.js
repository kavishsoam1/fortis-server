const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logger } = require('../../shared/logger');
/**
 * Payment Gateway Service - Handles interactions with payment gateways
 */
class PaymentGatewayService {
  /**
   * Create a payment intent (Stripe)
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment intent object
   */
  static async createPaymentIntent(paymentData) {
    try {
      const { 
        amount, 
        currency = 'inr', 
        description = '', 
        member_id,
        metadata = {} 
      } = paymentData;
      
      // Convert amount to cents/paise as Stripe requires
      const amountInSmallestUnit = Math.round(parseFloat(amount) * 100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency: currency.toLowerCase(),
        description,
        metadata: {
          member_id,
          ...metadata
        }
      });
      
      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: amount,
        currency: currency,
        status: paymentIntent.status,
        gateway: 'stripe'
      };
    } catch (error) {
      logger.error('Stripe payment intent error:', error);
      throw new Error(`Payment gateway error: ${error.message}`);
    }
  }
  
  /**
   * Retrieve payment intent status (Stripe)
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent details
   */
  static async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back from cents/paise
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        gateway: 'stripe',
        gateway_response: paymentIntent
      };
    } catch (error) {
      logger.error('Stripe retrieve payment intent error:', error);
      throw new Error(`Payment gateway error: ${error.message}`);
    }
  }
  
  /**
   * Create a refund (Stripe)
   * @param {Object} refundData - Refund data
   * @returns {Promise<Object>} Refund object
   */
  static async createRefund(refundData) {
    try {
      const { payment_intent_id, amount, reason = 'requested_by_customer' } = refundData;
      
      // Convert amount to cents/paise as Stripe requires
      const amountInSmallestUnit = Math.round(parseFloat(amount) * 100);
      
      const refund = await stripe.refunds.create({
        payment_intent: payment_intent_id,
        amount: amountInSmallestUnit,
        reason
      });
      
      return {
        id: refund.id,
        payment_intent_id: payment_intent_id,
        amount: amount,
        status: refund.status,
        gateway: 'stripe',
        gateway_response: refund
      };
    } catch (error) {
      logger.error('Stripe refund error:', error);
      throw new Error(`Refund gateway error: ${error.message}`);
    }
  }
  
  /**
   * Create a payment method token (Stripe)
   * @param {Object} cardData - Card data
   * @returns {Promise<Object>} Payment method token
   */
  static async createPaymentMethod(cardData) {
    try {
      const { 
        number, 
        exp_month, 
        exp_year, 
        cvc, 
        name 
      } = cardData;
      
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number,
          exp_month,
          exp_year,
          cvc
        },
        billing_details: {
          name
        }
      });
      
      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        },
        gateway: 'stripe'
      };
    } catch (error) {
      logger.error('Stripe payment method error:', error);
      throw new Error(`Payment method creation error: ${error.message}`);
    }
  }
  
  /**
   * Process webhook event (Stripe)
   * @param {string} payload - Webhook payload
   * @param {string} signature - Webhook signature
   * @returns {Promise<Object>} Processed event
   */
  static async processWebhook(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      // Depending on the event type, you would handle different scenarios
      switch (event.type) {
        case 'payment_intent.succeeded':
          // Handle successful payment
          return {
            type: 'payment.succeeded',
            data: {
              payment_intent_id: event.data.object.id,
              amount: event.data.object.amount / 100,
              currency: event.data.object.currency,
              status: event.data.object.status,
              metadata: event.data.object.metadata
            }
          };
          
        case 'payment_intent.payment_failed':
          // Handle failed payment
          return {
            type: 'payment.failed',
            data: {
              payment_intent_id: event.data.object.id,
              amount: event.data.object.amount / 100,
              currency: event.data.object.currency,
              status: event.data.object.status,
              error: event.data.object.last_payment_error,
              metadata: event.data.object.metadata
            }
          };
          
        case 'charge.refunded':
          // Handle refund
          return {
            type: 'payment.refunded',
            data: {
              payment_intent_id: event.data.object.payment_intent,
              refund_id: event.data.object.refunds.data[0].id,
              amount: event.data.object.refunds.data[0].amount / 100,
              status: event.data.object.refunds.data[0].status,
              metadata: event.data.object.metadata
            }
          };
          
        default:
          // Unexpected event type
          return {
            type: 'unknown',
            data: event
          };
      }
    } catch (error) {
      logger.error('Stripe webhook error:', error);
      throw new Error(`Webhook processing error: ${error.message}`);
    }
  }
}

module.exports = PaymentGatewayService;
