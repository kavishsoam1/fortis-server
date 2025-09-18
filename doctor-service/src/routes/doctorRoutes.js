const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctorController');
const { validate, doctorValidation } = require('../middlewares/validationMiddleware');

/**
 * @route   POST /api/doctors
 * @desc    Create a new doctor
 * @access  Public
 */
router.post(
  '/',
  validate(doctorValidation.createSchema),
  DoctorController.createDoctor
);

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors with pagination
 * @access  Public
 */
router.get('/', DoctorController.getAllDoctors);

/**
 * @route   GET /api/doctors/:id
 * @desc    Get a single doctor by ID
 * @access  Public
 */
router.get('/:id', DoctorController.getDoctorById);

/**
 * @route   GET /api/doctors/specialization/:specialization
 * @desc    Get doctors by specialization
 * @access  Public
 */
router.get('/specialization/:specialization', DoctorController.getDoctorsBySpecialization);

/**
 * @route   PUT /api/doctors/:id
 * @desc    Update a doctor
 * @access  Public
 */
router.put(
  '/:id',
  validate(doctorValidation.updateSchema),
  DoctorController.updateDoctor
);

/**
 * @route   DELETE /api/doctors/:id
 * @desc    Delete a doctor
 * @access  Public
 */
router.delete('/:id', DoctorController.deleteDoctor);

/**
 * @route   GET /api/doctors/:id/appointments
 * @desc    Get all appointments for a doctor
 * @access  Public
 */
router.get('/:id/appointments', DoctorController.getDoctorAppointments);

/**
 * @route   GET /api/doctors/:id/schedule
 * @desc    Get doctor's schedule for a specific date range
 * @access  Public
 */
router.get('/:id/schedule', DoctorController.getDoctorSchedule);

module.exports = router;
