const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validate, authValidation } = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * @route   POST /auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post(
  '/send-otp',
  validate(authValidation.sendOtpSchema),
  AuthController.sendOtp
);

/**
 * @route   POST /auth/verify-otp
 * @desc    Verify OTP and issue tokens
 * @access  Public
 */
router.post(
  '/verify-otp',
  validate(authValidation.verifyOtpSchema),
  AuthController.verifyOtp
);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(authValidation.refreshSchema),
  AuthController.refresh
);

/**
 * @route   POST /auth/revoke
 * @desc    Revoke refresh token (logout)
 * @access  Public
 */
router.post(
  '/revoke',
  validate(authValidation.revokeSchema),
  AuthController.revoke
);

/**
 * @route   GET /auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get(
  '/profile',
  authMiddleware,
  AuthController.getUserProfile
);

/**
 * @route   PUT /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authMiddleware,
  validate(authValidation.updateProfileSchema),
  AuthController.updateUserProfile
);

module.exports = router;
