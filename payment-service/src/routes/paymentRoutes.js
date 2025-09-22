const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { validate, paymentValidation } = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Routes that need authentication
router.use([
  '/payment-intent',
  '/payments/:id',
  '/process-payment',
  '/members/:memberId/payments',
  '/payment-methods',
  '/payment-methods/:id'
], authMiddleware);

/**
 * @route   POST /api/payment-intent
 * @desc    Create a payment intent
 * @access  Private
 */
router.post(
  '/payment-intent',
  validate(paymentValidation.paymentIntentSchema),
  PaymentController.createPaymentIntent
);

/**
 * @route   POST /api/process-payment
 * @desc    Process a payment
 * @access  Private
 */
router.post(
  '/process-payment',
  validate(paymentValidation.processPaymentSchema),
  PaymentController.processPayment
);

/**
 * @route   POST /api/webhook
 * @desc    Process a webhook event from payment gateway
 * @access  Public
 */
router.post('/webhook', PaymentController.processWebhook);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment details
 * @access  Private
 */
router.get('/payments/:id', PaymentController.getPayment);

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Create a refund
 * @access  Private
 */
router.post(
  '/payments/:id/refund',
  authMiddleware,
  validate(paymentValidation.refundSchema),
  PaymentController.createRefund
);

/**
 * @route   GET /api/members/:memberId/payments
 * @desc    Get member payments
 * @access  Private
 */
router.get('/members/:memberId/payments', PaymentController.getMemberPayments);

/**
 * @route   POST /api/payment-methods
 * @desc    Add a payment method
 * @access  Private
 */
router.post(
  '/payment-methods',
  validate(paymentValidation.addPaymentMethodSchema),
  PaymentController.addPaymentMethod
);

/**
 * @route   GET /api/members/:memberId/payment-methods
 * @desc    Get member payment methods
 * @access  Private
 */
router.get(
  '/members/:memberId/payment-methods',
  authMiddleware,
  PaymentController.getMemberPaymentMethods
);

/**
 * @route   DELETE /api/payment-methods/:id
 * @desc    Delete payment method
 * @access  Private
 */
router.delete('/payment-methods/:id', PaymentController.deletePaymentMethod);

module.exports = router;
