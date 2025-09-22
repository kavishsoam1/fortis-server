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
 * Registration validation schemas
 */
const registrationValidation = {
  /**
   * Schema for registering a member
   */
  registerSchema: Joi.object({
    consent_flags: Joi.object({
      data_sharing: Joi.boolean().default(false),
      marketing: Joi.boolean().default(false),
      research: Joi.boolean().default(false),
      third_party: Joi.boolean().default(false)
    }).default({})
  }),

  /**
   * Schema for hospital webhook
   */
  webhookSchema: Joi.object({
    member_id: Joi.string().guid().required().messages({
      'any.required': 'member_id is required',
      'string.guid': 'member_id must be a valid UUID'
    }),
    hospital_guid: Joi.string().allow(null).messages({
      'string.base': 'hospital_guid must be a string'
    }),
    status: Joi.string().valid('pending', 'registered', 'failed').required().messages({
      'any.required': 'status is required',
      'any.only': 'status must be one of: pending, registered, failed'
    }),
    error_message: Joi.string().allow('', null)
  }),

  /**
   * Schema for mock status update
   */
  mockStatusSchema: Joi.object({
    status: Joi.string().valid('pending', 'registered', 'failed').required().messages({
      'any.required': 'status is required',
      'any.only': 'status must be one of: pending, registered, failed'
    }),
    hospital_guid: Joi.string().allow('', null),
    error_message: Joi.string().allow('', null)
  })
};

module.exports = {
  validate,
  registrationValidation
};
