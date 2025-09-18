const DoctorModel = require('../models/doctorModel');
const { ApiError } = require('../../../shared/error-handler');

/**
 * Controller for doctor-related operations
 */
class DoctorController {
  /**
   * Create a new doctor
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createDoctor(req, res, next) {
    try {
      const doctorData = req.body;
      const doctor = await DoctorModel.create(doctorData);
      res.status(201).json({
        success: true,
        data: doctor
      });
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique violation error code
        if (error.detail.includes('email')) {
          return next(new ApiError(400, 'A doctor with that email already exists'));
        }
        if (error.detail.includes('license_number')) {
          return next(new ApiError(400, 'A doctor with that license number already exists'));
        }
        return next(new ApiError(400, 'Unique constraint violation'));
      }
      next(error);
    }
  }

  /**
   * Get all doctors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAllDoctors(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      
      const doctors = await DoctorModel.findAll(limit, offset);
      res.status(200).json({
        success: true,
        count: doctors.length,
        page,
        data: doctors
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single doctor by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDoctorById(req, res, next) {
    try {
      const { id } = req.params;
      const doctor = await DoctorModel.findById(id);
      
      if (!doctor) {
        throw new ApiError(404, `Doctor not found with id ${id}`);
      }
      
      res.status(200).json({
        success: true,
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get doctors by specialization
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDoctorsBySpecialization(req, res, next) {
    try {
      const { specialization } = req.params;
      const doctors = await DoctorModel.findBySpecialization(specialization);
      
      res.status(200).json({
        success: true,
        count: doctors.length,
        data: doctors
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a doctor by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updateDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const doctorData = req.body;
      
      const updatedDoctor = await DoctorModel.update(id, doctorData);
      
      if (!updatedDoctor) {
        throw new ApiError(404, `Doctor not found with id ${id}`);
      }
      
      res.status(200).json({
        success: true,
        data: updatedDoctor
      });
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.detail.includes('email')) {
          return next(new ApiError(400, 'Email already in use by another doctor'));
        }
        if (error.detail.includes('license_number')) {
          return next(new ApiError(400, 'License number already in use by another doctor'));
        }
        return next(new ApiError(400, 'Unique constraint violation'));
      }
      next(error);
    }
  }

  /**
   * Delete a doctor by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await DoctorModel.delete(id);
      
      if (!deleted) {
        throw new ApiError(404, `Doctor not found with id ${id}`);
      }
      
      res.status(200).json({
        success: true,
        message: `Doctor with id ${id} deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all appointments for a doctor
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDoctorAppointments(req, res, next) {
    try {
      const { id } = req.params;
      
      // First check if doctor exists
      const doctor = await DoctorModel.findById(id);
      if (!doctor) {
        throw new ApiError(404, `Doctor not found with id ${id}`);
      }
      
      const appointments = await DoctorModel.getAppointments(id);
      
      res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get doctor's schedule for a specific date range
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDoctorSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const { start_date, end_date } = req.query;
      
      // Validate date inputs
      if (!start_date || !end_date) {
        throw new ApiError(400, 'Both start_date and end_date query parameters are required');
      }
      
      // Check if doctor exists
      const doctor = await DoctorModel.findById(id);
      if (!doctor) {
        throw new ApiError(404, `Doctor not found with id ${id}`);
      }
      
      const schedule = await DoctorModel.getSchedule(id, start_date, end_date);
      
      res.status(200).json({
        success: true,
        count: schedule.length,
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DoctorController;
