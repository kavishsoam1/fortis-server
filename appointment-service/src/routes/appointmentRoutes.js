const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { validate, appointmentValidation } = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Create a new appointment
router.post(
  '/',
  validate(appointmentValidation.createSchema),
  AppointmentController.createAppointment
);

// Get all appointments with pagination
router.get('/', AppointmentController.getAllAppointments);

// Get a single appointment by ID
router.get('/:id', AppointmentController.getAppointmentById);

// Get appointments by doctor ID
router.get('/doctor/:doctorId', AppointmentController.getAppointmentsByDoctorId);

// Get appointments by patient ID
router.get('/patient/:patientId', AppointmentController.getAppointmentsByPatientId);

// Get appointments by status
router.get('/status/:status', AppointmentController.getAppointmentsByStatus);

// Get appointments by date range
router.get('/date-range', AppointmentController.getAppointmentsByDateRange);

// Update an appointment
router.put(
  '/:id',
  validate(appointmentValidation.updateSchema),
  AppointmentController.updateAppointment
);

// Update appointment status
router.patch(
  '/:id/status',
  validate(appointmentValidation.statusUpdateSchema),
  AppointmentController.updateAppointmentStatus
);

// Delete an appointment
router.delete('/:id', AppointmentController.deleteAppointment);

// Get available slots by doctor specialty
router.get('/doctors/:specialty/slots', AppointmentController.getAvailableSlots);

// Get appointment audit history
router.get('/:id/audit', AppointmentController.getAppointmentAuditHistory);

module.exports = router;
