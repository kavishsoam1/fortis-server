const express = require('express');
const router = express.Router();
const RegistrationController = require('../controllers/registrationController');
const { validate, registrationValidation } = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Routes that require authentication
router.use('/register-member', authMiddleware);
router.use('/members', authMiddleware);

/**
 * @route   POST /register-member/:memberId
 * @desc    Register a member with the hospital system
 * @access  Private
 */
router.post(
  '/register-member/:memberId',
  validate(registrationValidation.registerSchema),
  RegistrationController.registerMember
);

/**
 * @route   GET /members/:memberId/registration
 * @desc    Get registration status for a member
 * @access  Private
 */
router.get(
  '/members/:memberId/registration',
  RegistrationController.getRegistrationStatus
);

/**
 * @route   GET /members/:memberId/registration/history
 * @desc    Get registration history for a member
 * @access  Private
 */
router.get(
  '/members/:memberId/registration/history',
  RegistrationController.getRegistrationHistory
);

/**
 * @route   POST /members/:memberId/registration/sync
 * @desc    Sync registration with hospital system
 * @access  Private
 */
router.post(
  '/members/:memberId/registration/sync',
  RegistrationController.syncRegistration
);

/**
 * @route   POST /webhook/hospital
 * @desc    Webhook endpoint for hospital system
 * @access  Public (but should be secured with API key in production)
 */
router.post(
  '/webhook/hospital',
  validate(registrationValidation.webhookSchema),
  RegistrationController.hospitalWebhook
);

/**
 * @route   POST /mock/:memberId/status
 * @desc    Mock endpoint to update registration status (for testing)
 * @access  Public (for development only)
 */
router.post(
  '/mock/:memberId/status',
  validate(registrationValidation.mockStatusSchema),
  RegistrationController.mockRegistrationProcess
);

module.exports = router;
