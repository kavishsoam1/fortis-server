const Joi = require('joi');
const { ApiError } = require('../../../shared/error-handler');

/**
 * Middleware to validate request data
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return next(new ApiError(400, `Validation error: ${errorMessage}`));
  }
  
  next();
};

/**
 * Validation schemas for patient data
 */
const patientValidation = {
  // Schema for creating a new patient
  createSchema: Joi.object({
    first_name: Joi.string().trim().min(2).max(100).required(),
    last_name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().pattern(/^[0-9+\-\s()]{8,20}$/),
    date_of_birth: Joi.date().iso().less('now').required(),
    address: Joi.string().trim().allow('', null),
    medical_history: Joi.string().trim().allow('', null)
  }),
  
  // Schema for updating a patient
  updateSchema: Joi.object({
    first_name: Joi.string().trim().min(2).max(100),
    last_name: Joi.string().trim().min(2).max(100),
    email: Joi.string().trim().email(),
    phone: Joi.string().trim().pattern(/^[0-9+\-\s()]{8,20}$/),
    date_of_birth: Joi.date().iso().less('now'),
    address: Joi.string().trim().allow('', null),
    medical_history: Joi.string().trim().allow('', null)
  }).min(1) // At least one field must be provided
};

module.exports = {
  validate,
  patientValidation
};
