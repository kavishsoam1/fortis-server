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
 * Validation schemas for doctor data
 */
const doctorValidation = {
  // Schema for creating a new doctor
  createSchema: Joi.object({
    first_name: Joi.string().trim().min(2).max(100).required(),
    last_name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().pattern(/^[0-9+\-\s()]{8,20}$/).required(),
    specialization: Joi.string().trim().min(2).max(100).required(),
    license_number: Joi.string().trim().min(5).max(50).required(),
    years_of_experience: Joi.number().integer().min(0).max(100)
  }),
  
  // Schema for updating a doctor
  updateSchema: Joi.object({
    first_name: Joi.string().trim().min(2).max(100),
    last_name: Joi.string().trim().min(2).max(100),
    email: Joi.string().trim().email(),
    phone: Joi.string().trim().pattern(/^[0-9+\-\s()]{8,20}$/),
    specialization: Joi.string().trim().min(2).max(100),
    license_number: Joi.string().trim().min(5).max(50),
    years_of_experience: Joi.number().integer().min(0).max(100)
  }).min(1) // At least one field must be provided
};

module.exports = {
  validate,
  doctorValidation
};
