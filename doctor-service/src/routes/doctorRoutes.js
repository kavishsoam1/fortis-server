const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctorController');
const { validate, doctorValidation } = require('../middlewares/validationMiddleware');

// Create a new doctor
router.post(
  '/',
  validate(doctorValidation.createSchema),
  DoctorController.createDoctor
);

// Get all doctors with pagination
router.get('/', DoctorController.getAllDoctors);

// Get a single doctor by ID
router.get('/:id', DoctorController.getDoctorById);

// Get doctors by specialization
router.get('/specialization/:specialization', DoctorController.getDoctorsBySpecialization);

// Update a doctor
router.put(
  '/:id',
  validate(doctorValidation.updateSchema),
  DoctorController.updateDoctor
);

// Delete a doctor
router.delete('/:id', DoctorController.deleteDoctor);

// Get all appointments for a doctor
router.get('/:id/appointments', DoctorController.getDoctorAppointments);

// Get doctor's schedule for a specific date range
router.get('/:id/schedule', DoctorController.getDoctorSchedule);

module.exports = router;
