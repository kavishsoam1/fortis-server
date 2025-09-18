const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { validate, appointmentValidation } = require('../middlewares/validationMiddleware');

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment
 * @access  Public
 */
router.post(
  '/',
  validate(appointmentValidation.createSchema),
  AppointmentController.createAppointment
);

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments with pagination
 * @access  Public
 */
router.get('/', AppointmentController.getAllAppointments);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get a single appointment by ID
 * @access  Public
 */
router.get('/:id', AppointmentController.getAppointmentById);

/**
 * @route   GET /api/appointments/doctor/:doctorId
 * @desc    Get appointments by doctor ID
 * @access  Public
 */
router.get('/doctor/:doctorId', AppointmentController.getAppointmentsByDoctorId);

/**
 * @route   GET /api/appointments/patient/:patientId
 * @desc    Get appointments by patient ID
 * @access  Public
 */
router.get('/patient/:patientId', AppointmentController.getAppointmentsByPatientId);

/**
 * @route   GET /api/appointments/status/:status
 * @desc    Get appointments by status
 * @access  Public
 */
router.get('/status/:status', AppointmentController.getAppointmentsByStatus);

/**
 * @route   GET /api/appointments/date-range
 * @desc    Get appointments by date range
 * @access  Public
 */
router.get('/date-range', AppointmentController.getAppointmentsByDateRange);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update an appointment
 * @access  Public
 */
router.put(
  '/:id',
  validate(appointmentValidation.updateSchema),
  AppointmentController.updateAppointment
);

/**
 * @route   PATCH /api/appointments/:id/status
 * @desc    Update appointment status
 * @access  Public
 */
router.patch(
  '/:id/status',
  validate(appointmentValidation.statusUpdateSchema),
  AppointmentController.updateAppointmentStatus
);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Delete an appointment
 * @access  Public
 */
router.delete('/:id', AppointmentController.deleteAppointment);

module.exports = router;
