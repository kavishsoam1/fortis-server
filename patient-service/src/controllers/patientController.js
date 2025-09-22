const PatientModel = require('../models/patientModel');
const { ApiError } = require('../../../shared/error-handler');

class PatientController {
  /**
   * Create a new patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createPatient(req, res, next) {
    try {
      const patientData = req.body;
      const patient = await PatientModel.create(patientData);
      res.status(201).json({
        success: true,
        data: patient
      });
    } catch (error) {
      if (error.code === '23505') {
        return next(new ApiError(400, 'A patient with that email already exists'));
      }
      next(error);
    }
  }

  /**
   * Get all patients
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAllPatients(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      
      const patients = await PatientModel.findAll(limit, offset);
      res.status(200).json({
        success: true,
        count: patients.length,
        page,
        data: patients
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single patient by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getPatientById(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await PatientModel.findById(id);
      
      if (!patient) {
        throw new ApiError(404, `Patient not found with id ${id}`);
      }
      
      res.status(200).json({
        success: true,
        data: patient
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a patient by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updatePatient(req, res, next) {
    try {
      const { id } = req.params;
      const patientData = req.body;
      
      const updatedPatient = await PatientModel.update(id, patientData);
      
      if (!updatedPatient) {
        throw new ApiError(404, `Patient not found with id ${id}`);
      }
      
      res.status(200).json({
        success: true,
        data: updatedPatient
      });
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        return next(new ApiError(400, 'Email already in use by another patient'));
      }
      next(error);
    }
  }

  /**
   * Delete a patient by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deletePatient(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await PatientModel.delete(id);
      
      if (!deleted) {
        throw new ApiError(404, `Patient not found with id ${id}`);
      }
      
      res.status(200).json({
        success: true,
        message: `Patient with id ${id} deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all appointments for a patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getPatientAppointments(req, res, next) {
    try {
      const { id } = req.params;
      
      const patient = await PatientModel.findById(id);
      if (!patient) {
        throw new ApiError(404, `Patient not found with id ${id}`);
      }
      
      const appointments = await PatientModel.getAppointments(id);
      
      res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientController;
