const express = require('express');
const router = express.Router();
const InvoiceController = require('../controllers/invoiceController');
const { validate, invoiceValidation } = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   POST /api/invoices
 * @desc    Create a new invoice
 * @access  Private
 */
router.post(
  '/',
  validate(invoiceValidation.createInvoiceSchema),
  InvoiceController.createInvoice
);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get('/:id', InvoiceController.getInvoice);

/**
 * @route   GET /api/invoices/members/:memberId
 * @desc    Get invoices for a member
 * @access  Private
 */
router.get('/members/:memberId', InvoiceController.getMemberInvoices);

/**
 * @route   GET /api/invoices/appointments/:appointmentId
 * @desc    Get invoice for an appointment
 * @access  Private
 */
router.get('/appointments/:appointmentId', InvoiceController.getAppointmentInvoice);

/**
 * @route   PATCH /api/invoices/:id/status
 * @desc    Update invoice status
 * @access  Private
 */
router.patch(
  '/:id/status',
  validate(invoiceValidation.updateStatusSchema),
  InvoiceController.updateInvoiceStatus
);

/**
 * @route   GET /api/invoices/status/pending
 * @desc    Get pending invoices
 * @access  Private
 */
router.get('/status/pending', InvoiceController.getPendingInvoices);

/**
 * @route   GET /api/invoices/status/paid
 * @desc    Get paid invoices
 * @access  Private
 */
router.get('/status/paid', InvoiceController.getPaidInvoices);

/**
 * @route   POST /api/invoices/:id/pay
 * @desc    Pay an invoice
 * @access  Private
 */
router.post(
  '/:id/pay',
  validate(invoiceValidation.payInvoiceSchema),
  InvoiceController.payInvoice
);

module.exports = router;
