const AppointmentModel = require('../models/appointmentModel');
const { ApiError } = require('../../../shared/error-handler');
const axios = require('axios');

/**
 * Controller for appointment-related operations
 */
class AppointmentController {
  /**
   * Create a new appointment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createAppointment(req, res, next) {
    try {
      const appointmentData = req.body;
      
      // Check for conflicts
      const hasConflict = await AppointmentModel.checkForConflicts(
        appointmentData.doctor_id,
        appointmentData.appointment_date,
        appointmentData.duration_minutes || 30
      );
      
      if (hasConflict) {
        throw new ApiError(409, 'This time slot is already booked. Please choose another time.');
      }
      
      // Check if patient and doctor exist (could be done via service calls)
      // For simplicity, we'll rely on the foreign key constraints in PostgreSQL
      
      const appointment = await AppointmentModel.create(appointmentData);
      
      res.status(201).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      // Handle foreign key violations
      if (error.code === '23503') { // PostgreSQL foreign key violation
        if (error.detail.includes('patient_id')) {
          return next(new ApiError(400, 'Patient not found'));
        }
        if (error.detail.includes('doctor_id')) {
          return next(new ApiError(400, 'Doctor not found'));
        }
        return next(new ApiError(400, 'Foreign key constraint violation'));
      }
      next(error);
    }
  }

  /**
   * Get all appointments
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAllAppointments(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      
      const appointments = await AppointmentModel.findAll(limit, offset);
      res.status(200).json({
        success: true,
        count: appointments.length,
        page,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single appointment by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAppointmentById(req, res, next) {
    try {
      const { id } = req.params;
      const appointment = await AppointmentModel.findById(id);
      
      if (!appointment) {
        throw new ApiError(404, `Appointment not found with id ${id}`);
      }
      
      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get appointments by doctor ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAppointmentsByDoctorId(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { start_date, end_date } = req.query;
      
      const appointments = await AppointmentModel.findByDoctorId(doctorId, start_date, end_date);
      
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
   * Get appointments by patient ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAppointmentsByPatientId(req, res, next) {
    try {
      const { patientId } = req.params;
      const { start_date, end_date } = req.query;
      
      const appointments = await AppointmentModel.findByPatientId(patientId, start_date, end_date);
      
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
   * Get appointments by status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAppointmentsByStatus(req, res, next) {
    try {
      const { status } = req.params;
      
      const validStatuses = ['scheduled', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      const appointments = await AppointmentModel.findByStatus(status);
      
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
   * Get appointments by date range
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAppointmentsByDateRange(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        throw new ApiError(400, 'Both start_date and end_date are required');
      }
      
      const appointments = await AppointmentModel.findByDateRange(start_date, end_date);
      
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
   * Update an appointment by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updateAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const appointmentData = req.body;
      
      // Check if appointment exists
      const existingAppointment = await AppointmentModel.findById(id);
      if (!existingAppointment) {
        throw new ApiError(404, `Appointment not found with id ${id}`);
      }
      
      // Check for conflicts if updating date or doctor
      if (
        appointmentData.appointment_date || 
        appointmentData.doctor_id || 
        appointmentData.duration_minutes
      ) {
        const doctorId = appointmentData.doctor_id || existingAppointment.doctor_id;
        const appointmentDate = appointmentData.appointment_date || existingAppointment.appointment_date;
        const durationMinutes = appointmentData.duration_minutes || existingAppointment.duration_minutes;
        
        const hasConflict = await AppointmentModel.checkForConflicts(
          doctorId,
          appointmentDate,
          durationMinutes,
          id // Exclude this appointment from conflict check
        );
        
        if (hasConflict) {
          throw new ApiError(409, 'This time slot is already booked. Please choose another time.');
        }
      }
      
      const updatedAppointment = await AppointmentModel.update(id, appointmentData);
      
      res.status(200).json({
        success: true,
        data: updatedAppointment
      });
    } catch (error) {
      // Handle foreign key violations
      if (error.code === '23503') {
        if (error.detail.includes('patient_id')) {
          return next(new ApiError(400, 'Patient not found'));
        }
        if (error.detail.includes('doctor_id')) {
          return next(new ApiError(400, 'Doctor not found'));
        }
        return next(new ApiError(400, 'Foreign key constraint violation'));
      }
      next(error);
    }
  }

  /**
   * Update appointment status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updateAppointmentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['scheduled', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      const updatedAppointment = await AppointmentModel.updateStatus(id, status);
      
      if (!updatedAppointment) {
        throw new ApiError(404, `Appointment not found with id ${id}`);
      }
      
      res.status(200).json({
        success: true,
        data: updatedAppointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an appointment by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await AppointmentModel.delete(id);
      
      if (!deleted) {
        throw new ApiError(404, `Appointment not found with id ${id}`);
      }
      
      res.status(200).json({
        success: true,
        message: `Appointment with id ${id} deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AppointmentController;
