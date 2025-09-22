const Joi = require('joi');
const { ApiError } = require('../../../shared/error-handler');

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

const appointmentValidation = {
  createSchema: Joi.object({
    patient_id: Joi.number().integer().positive().required(),
    doctor_id: Joi.number().integer().positive().required(),
    appointment_date: Joi.date().iso().greater('now').required(),
    duration_minutes: Joi.number().integer().min(15).max(180).default(30),
    status: Joi.string().valid('scheduled', 'completed', 'cancelled').default('scheduled'),
    notes: Joi.string().allow('', null)
  }),
  
  updateSchema: Joi.object({
    patient_id: Joi.number().integer().positive(),
    doctor_id: Joi.number().integer().positive(),
    appointment_date: Joi.date().iso(),
    duration_minutes: Joi.number().integer().min(15).max(180),
    status: Joi.string().valid('scheduled', 'completed', 'cancelled'),
    notes: Joi.string().allow('', null)
  }).min(1),
  
  statusUpdateSchema: Joi.object({
    status: Joi.string().valid('scheduled', 'completed', 'cancelled').required()
  })
};

module.exports = {
  validate,
  appointmentValidation
};
