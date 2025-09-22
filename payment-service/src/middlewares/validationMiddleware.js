const Joi = require('joi');
const { ApiError } = require('../../../shared/error-handler');

/**
 * Validate request body against a schema
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new ApiError(400, errorMessage));
    }

    next();
  };
};

/**
 * Payment validation schemas
 */
const paymentValidation = {
  /**
   * Schema for payment intent creation
   */
  paymentIntentSchema: Joi.object({
    invoice_id: Joi.string().uuid(),
    payment_method_id: Joi.string(),
    amount: Joi.number().precision(2).min(0),
    member_id: Joi.string().uuid().when('invoice_id', {
      is: Joi.exist().not(null),
      then: Joi.optional(),
      otherwise: Joi.required()
    })
  }).or('invoice_id', 'amount'),

  /**
   * Schema for payment processing
   */
  processPaymentSchema: Joi.object({
    payment_intent_id: Joi.string().required(),
    invoice_id: Joi.string().uuid(),
    member_id: Joi.string().uuid().required(),
    payment_method: Joi.string().required(),
    amount: Joi.number().precision(2).min(0),
    currency: Joi.string().length(3).uppercase().default('INR')
  }),

  /**
   * Schema for refund creation
   */
  refundSchema: Joi.object({
    amount: Joi.number().precision(2).min(0),
    reason: Joi.string().max(255)
  }),

  /**
   * Schema for adding payment method
   */
  addPaymentMethodSchema: Joi.object({
    member_id: Joi.string().uuid().required(),
    token: Joi.string(),
    card_details: Joi.object({
      number: Joi.string().pattern(/^\d{13,19}$/),
      exp_month: Joi.number().integer().min(1).max(12),
      exp_year: Joi.number().integer().min(new Date().getFullYear() % 100),
      cvc: Joi.string().pattern(/^\d{3,4}$/),
      name: Joi.string()
    }),
    type: Joi.string().when('token', {
      is: Joi.exist().not(null),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    provider: Joi.string().when('token', {
      is: Joi.exist().not(null),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    last_four: Joi.string().length(4).pattern(/^\d{4}$/).when('token', {
      is: Joi.exist().not(null),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    expiry_month: Joi.string().pattern(/^\d{1,2}$/).when('token', {
      is: Joi.exist().not(null),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    expiry_year: Joi.string().pattern(/^\d{2,4}$/).when('token', {
      is: Joi.exist().not(null),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    is_default: Joi.boolean().default(true)
  }).or('token', 'card_details')
};

/**
 * Invoice validation schemas
 */
const invoiceValidation = {
  /**
   * Schema for invoice creation
   */
  createInvoiceSchema: Joi.object({
    invoice_data: Joi.object({
      member_id: Joi.string().uuid().required(),
      hospital_guid: Joi.string(),
      appointment_id: Joi.string().uuid(),
      amount: Joi.number().precision(2).min(0),
      tax_amount: Joi.number().precision(2).min(0),
      discount_amount: Joi.number().precision(2).min(0),
      currency: Joi.string().length(3).uppercase().default('INR'),
      due_date: Joi.date().iso(),
      notes: Joi.string(),
      metadata: Joi.object()
    }).required(),
    items: Joi.array().items(
      Joi.object({
        description: Joi.string().required(),
        quantity: Joi.number().integer().min(1).default(1),
        unit_price: Joi.number().precision(2).min(0).required(),
        discount_amount: Joi.number().precision(2).min(0).default(0),
        tax_amount: Joi.number().precision(2).min(0).default(0),
        item_type: Joi.string(),
        metadata: Joi.object()
      })
    )
  }),

  /**
   * Schema for updating invoice status
   */
  updateStatusSchema: Joi.object({
    status: Joi.string().valid('pending', 'paid', 'cancelled', 'refunded', 'partially_paid').required()
  }),

  /**
   * Schema for paying an invoice manually
   */
  payInvoiceSchema: Joi.object({
    payment_method: Joi.string().required(),
    payment_details: Joi.object().default({}),
    amount: Joi.number().precision(2).min(0)
  })
};

module.exports = {
  validate,
  paymentValidation,
  invoiceValidation
};
