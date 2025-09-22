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

const authValidation = {
  sendOtpSchema: Joi.object({
    phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required()
      .messages({
        'string.pattern.base': 'Phone number must be in E.164 format',
        'any.required': 'Phone number is required'
      })
  }),

  verifyOtpSchema: Joi.object({
    phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required()
      .messages({
        'string.pattern.base': 'Phone number must be in E.164 format',
        'any.required': 'Phone number is required'
      }),
    otp: Joi.string().length(6).pattern(/^\d+$/).required()
      .messages({
        'string.length': 'OTP must be 6 digits',
        'string.pattern.base': 'OTP must contain only digits',
        'any.required': 'OTP is required'
      })
  }),

  refreshSchema: Joi.object({
    refresh_token: Joi.string().required()
      .messages({
        'any.required': 'Refresh token is required'
      })
  }),

  revokeSchema: Joi.object({
    refresh_token: Joi.string().required()
      .messages({
        'any.required': 'Refresh token is required'
      })
  }),

  updateProfileSchema: Joi.object({
    email: Joi.string().email().messages({
      'string.email': 'Please provide a valid email address'
    })
  })
};

module.exports = {
  validate,
  authValidation
};
