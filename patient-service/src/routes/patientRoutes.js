const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patientController');
const { validate, patientValidation } = require('../middlewares/validationMiddleware');

/**
 * @route   POST /api/patients
 * @desc    Create a new patient
 * @access  Public
 */
router.post(
  '/',
  validate(patientValidation.createSchema),
  PatientController.createPatient
);

/**
 * @route   GET /api/patients
 * @desc    Get all patients with pagination
 * @access  Public
 */
router.get('/', PatientController.getAllPatients);

/**
 * @route   GET /api/patients/:id
 * @desc    Get a single patient by ID
 * @access  Public
 */
router.get('/:id', PatientController.getPatientById);

/**
 * @route   PUT /api/patients/:id
 * @desc    Update a patient
 * @access  Public
 */
router.put(
  '/:id',
  validate(patientValidation.updateSchema),
  PatientController.updatePatient
);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete a patient
 * @access  Public
 */
router.delete('/:id', PatientController.deletePatient);

/**
 * @route   GET /api/patients/:id/appointments
 * @desc    Get all appointments for a patient
 * @access  Public
 */
router.get('/:id/appointments', PatientController.getPatientAppointments);

module.exports = router;
