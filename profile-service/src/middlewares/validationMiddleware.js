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
 * Member validation schemas
 */
const memberValidation = {
  /**
   * Schema for creating a member
   */
  createSchema: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Name is required'
    }),
    dob: Joi.date().iso().allow(null).messages({
      'date.base': 'Date of birth must be a valid date',
      'date.format': 'Date of birth must be in ISO format (YYYY-MM-DD)'
    }),
    gender: Joi.string().valid('male', 'female', 'other').allow(null).messages({
      'any.only': 'Gender must be one of: male, female, other'
    }),
    phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).allow(null).messages({
      'string.pattern.base': 'Phone number must be in E.164 format'
    }),
    email: Joi.string().email().allow(null).messages({
      'string.email': 'Please provide a valid email address'
    }),
    address: Joi.object({
      line1: Joi.string(),
      line2: Joi.string().allow('', null),
      city: Joi.string(),
      state: Joi.string(),
      postal_code: Joi.string(),
      country: Joi.string()
    }).allow(null),
    relation_to_user: Joi.string().valid(
      'self', 'spouse', 'child', 'parent', 'sibling', 'grandparent', 
      'grandchild', 'friend', 'other'
    ).default('self').messages({
      'any.only': 'Relation must be one of: self, spouse, child, parent, sibling, grandparent, grandchild, friend, other'
    }),
    emergency_contact: Joi.object({
      name: Joi.string(),
      relationship: Joi.string(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/),
      email: Joi.string().email().allow('', null)
    }).allow(null),
    hospital_guid: Joi.string().allow('', null),
    profile_completed: Joi.boolean().default(false)
  }),

  /**
   * Schema for updating a member
   */
  updateSchema: Joi.object({
    name: Joi.string().messages({
      'string.empty': 'Name cannot be empty'
    }),
    dob: Joi.date().iso().allow(null).messages({
      'date.base': 'Date of birth must be a valid date',
      'date.format': 'Date of birth must be in ISO format (YYYY-MM-DD)'
    }),
    gender: Joi.string().valid('male', 'female', 'other').allow(null).messages({
      'any.only': 'Gender must be one of: male, female, other'
    }),
    phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).allow(null).messages({
      'string.pattern.base': 'Phone number must be in E.164 format'
    }),
    email: Joi.string().email().allow(null).messages({
      'string.email': 'Please provide a valid email address'
    }),
    address: Joi.object({
      line1: Joi.string(),
      line2: Joi.string().allow('', null),
      city: Joi.string(),
      state: Joi.string(),
      postal_code: Joi.string(),
      country: Joi.string()
    }).allow(null),
    relation_to_user: Joi.string().valid(
      'self', 'spouse', 'child', 'parent', 'sibling', 'grandparent', 
      'grandchild', 'friend', 'other'
    ).messages({
      'any.only': 'Relation must be one of: self, spouse, child, parent, sibling, grandparent, grandchild, friend, other'
    }),
    emergency_contact: Joi.object({
      name: Joi.string(),
      relationship: Joi.string(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/),
      email: Joi.string().email().allow('', null)
    }).allow(null),
    hospital_guid: Joi.string().allow('', null),
    profile_completed: Joi.boolean()
  }),

  /**
   * Schema for linking an existing member
   */
  linkSchema: Joi.object({
    relationship_type: Joi.string().valid(
      'spouse', 'child', 'parent', 'sibling', 'grandparent', 
      'grandchild', 'friend', 'other'
    ).required().messages({
      'any.required': 'Relationship type is required',
      'any.only': 'Relationship type must be one of: spouse, child, parent, sibling, grandparent, grandchild, friend, other'
    })
  })
};

module.exports = {
  validate,
  memberValidation
};
