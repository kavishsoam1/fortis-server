const AppointmentModel = require('../models/appointmentModel');
const { ApiError } = require('../../../shared/error-handler');
const axios = require('axios');

class AppointmentController {
  /**
   * Create a new appointment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createAppointment(req, res, next) {
    try {
      const { user_id } = req.user;
      const appointmentData = req.body;
      
      appointmentData.created_by = user_id;
      
      const hasConflict = await AppointmentModel.checkForConflicts(
        appointmentData.doctor_id,
        appointmentData.appointment_date,
        appointmentData.duration_minutes || 30
      );
      
      if (hasConflict) {
        throw new ApiError(409, 'This time slot is already booked. Please choose another time.');
      }
      
      
      const appointment = await AppointmentModel.create(appointmentData);
      
      await AppointmentModel.createAuditRecord({
        appointment_id: appointment.appointment_id,
        action: 'created',
        old_values: null,
        new_values: appointment,
        changed_by: user_id
      });
      
      console.log(`Event: appointment.booked, appointment_id: ${appointment.appointment_id}`);
      
      res.status(201).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      if (error.code === '23503') { // PostgreSQL foreign key violation
        if (error.detail.includes('member_id')) {
          return next(new ApiError(400, 'Member not found'));
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
      const { user_id } = req.user;
      const appointmentData = req.body;
      
      const existingAppointment = await AppointmentModel.findById(id);
      if (!existingAppointment) {
        throw new ApiError(404, `Appointment not found with id ${id}`);
      }
      
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
          id 
        );
        
        if (hasConflict) {
          throw new ApiError(409, 'This time slot is already booked. Please choose another time.');
        }
      }
      
      const updatedAppointment = await AppointmentModel.update(id, appointmentData, user_id);
      
      if (appointmentData.status && appointmentData.status !== existingAppointment.status) {
        console.log(`Event: appointment.${appointmentData.status}, appointment_id: ${id}`);
      }
      
      if (appointmentData.appointment_date && appointmentData.appointment_date !== existingAppointment.appointment_date) {
        console.log(`Event: appointment.rescheduled, appointment_id: ${id}`);
      }
      
      res.status(200).json({
        success: true,
        data: updatedAppointment
      });
    } catch (error) {
      if (error.code === '23503') {
        if (error.detail.includes('member_id')) {
          return next(new ApiError(400, 'Member not found'));
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
      const { user_id } = req.user;
      
      const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show'];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      const updatedAppointment = await AppointmentModel.updateStatus(id, status, user_id);
      
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
      const { user_id } = req.user;
      
      const deleted = await AppointmentModel.delete(id, user_id);
      
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

  /**
   * Get available slots by doctor specialty
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAvailableSlots(req, res, next) {
    try {
      const { specialty } = req.params;
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        throw new ApiError(400, 'Both start_date and end_date are required');
      }
      
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (isNaN(startDate) || isNaN(endDate)) {
        throw new ApiError(400, 'Invalid date format. Use ISO date format (YYYY-MM-DD)');
      }
      
      const maxDaysRange = 14; // 2 weeks
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > maxDaysRange) {
        throw new ApiError(400, `Date range too large. Maximum range is ${maxDaysRange} days`);
      }
      
      const slots = await AppointmentModel.getAvailableSlots(specialty, start_date, end_date);
      
      res.status(200).json({
        success: true,
        count: slots.length,
        data: slots
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get appointment audit history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAppointmentAuditHistory(req, res, next) {
    try {
      const { id } = req.params;
      
      const appointment = await AppointmentModel.findById(id);
      if (!appointment) {
        throw new ApiError(404, `Appointment not found with id ${id}`);
      }
      
      const history = await AppointmentModel.getAuditHistory(id);
      
      res.status(200).json({
        success: true,
        count: history.length,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AppointmentController;
