const DoctorModel = require('../models/doctorModel');
const ScheduleModel = require('../models/scheduleModel');
const TimeOffModel = require('../models/timeOffModel');
// const DepartmentModel = require('../models/departmentModel');
// const SpecialtyModel = require('../models/specialtyModel');
const { ApiError } = require('../../../shared/error-handler');
const { logger } = require('../../../shared/logger');

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
      if (error.code === '23505') {
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
      const useUUID = req.query.use_uuid === 'true';
      const doctor = await DoctorModel.findById(id, useUUID);
      
      if (!doctor) {
        throw new ApiError(404, `Doctor not found with id ${id}`);
      }
      
      const schedule = await ScheduleModel.findByDoctorId(doctor.id);
      const timeOff = await TimeOffModel.findByDoctorId(doctor.id, {
        startDate: new Date().toISOString().split('T')[0] // Get from today onwards
      });
      
      res.status(200).json({
        success: true,
        data: {
          ...doctor,
          schedule,
          time_off: timeOff
        }
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
      
      if (req.query.include_schedule === 'true' && doctors.length > 0) {
        const doctorIds = doctors.map(doctor => doctor.id);
        const schedulesByDoctor = await ScheduleModel.getMultipleDoctorSchedules(doctorIds);
        
        doctors.forEach(doctor => {
          doctor.schedule = schedulesByDoctor[doctor.id] || [];
        });
      }
      
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
      const useUUID = req.query.use_uuid === 'true';
      
      const doctor = await DoctorModel.findById(id, useUUID);
      if (!doctor) {
        throw new ApiError(404, `Doctor not found with id ${id}`);
      }
      
      const weeklySchedule = await ScheduleModel.findByDoctorId(doctor.id);
      
      let timeOff = [];
      if (start_date && end_date) {
        timeOff = await TimeOffModel.findByDoctorId(doctor.id, { startDate: start_date, endDate: end_date });
      } else {
        timeOff = await TimeOffModel.findByDoctorId(doctor.id);
      }
      
      let appointments = [];
      if (start_date && end_date) {
        appointments = await DoctorModel.getAppointmentsByDateRange(doctor.id, start_date, end_date);
      }
      
      res.status(200).json({
        success: true,
        data: {
          doctor: {
            id: doctor.id,
            doctor_id: doctor.doctor_id,
            name: `${doctor.first_name} ${doctor.last_name}`,
            specialty: doctor.specialty_name,
            department: doctor.department_name
          },
          weekly_schedule: weeklySchedule,
          time_off: timeOff,
          appointments
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add weekly schedule for a doctor
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async addDoctorSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const useUUID = req.query.use_uuid === 'true';
      const { schedule_data } = req.body;
      
      const doctor = await DoctorModel.findById(id, useUUID);
      if (!doctor) {
        throw new ApiError(404, `Doctor not found with id ${id}`);
      }
      
      if (!Array.isArray(schedule_data) || schedule_data.length === 0) {
        throw new ApiError(400, 'Schedule data must be a non-empty array');
      }
      
      const processedData = schedule_data.map(entry => ({
        ...entry,
        doctor_id: doctor.id
      }));
      
      const createdSchedules = await ScheduleModel.createBulk(processedData);
      
      res.status(201).json({
        success: true,
        count: createdSchedules.length,
        data: createdSchedules
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Delete a schedule entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteScheduleEntry(req, res, next) {
    try {
      const { schedule_id } = req.params;
      
      const schedule = await ScheduleModel.findById(schedule_id);
      if (!schedule) {
        throw new ApiError(404, `Schedule not found with id ${schedule_id}`);
      }
      
      const deleted = await ScheduleModel.delete(schedule_id);
      logger.info(`Deleted schedule entry with id ${deleted?.schedule_id}`);
      res.status(200).json({
        success: true,
        message: `Schedule entry with id ${schedule_id} deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Add time off for a doctor
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async addDoctorTimeOff(req, res, next) {
    try {
      const { id } = req.params;
      const useUUID = req.query.use_uuid === 'true';
      const timeOffData = req.body;
      
      const doctor = await DoctorModel.findById(id, useUUID);
      if (!doctor) {
        throw new ApiError(404, `Doctor not found with id ${id}`);
      }
      
      timeOffData.doctor_id = doctor.id;
      
      const overlapping = await TimeOffModel.findOverlapping(
        doctor.id, 
        timeOffData.start_datetime, 
        timeOffData.end_datetime
      );
      
      if (overlapping.length > 0) {
        throw new ApiError(409, 'This time off period overlaps with an existing time off entry');
      }
      
      const timeOff = await TimeOffModel.create(timeOffData);
      
      res.status(201).json({
        success: true,
        data: timeOff
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get time off entries for a doctor
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDoctorTimeOff(req, res, next) {
    try {
      const { id } = req.params;
      const { start_date, end_date } = req.query;
      const useUUID = req.query.use_uuid === 'true';
      
      const doctor = await DoctorModel.findById(id, useUUID);
      if (!doctor) {
        throw new ApiError(404, `Doctor not found with id ${id}`);
      }
      
      const timeOff = await TimeOffModel.findByDoctorId(doctor.id, { startDate: start_date, endDate: end_date });
      
      res.status(200).json({
        success: true,
        count: timeOff.length,
        data: timeOff
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Delete a time off entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteTimeOffEntry(req, res, next) {
    try {
      const { time_off_id } = req.params;
      
      const timeOff = await TimeOffModel.findById(time_off_id);
      if (!timeOff) {
        throw new ApiError(404, `Time off entry not found with id ${time_off_id}`);
      }
      
      const deleted = await TimeOffModel.delete(time_off_id);
      logger.info(`Deleted time off entry with id ${deleted?.time_off_id}`);
      res.status(200).json({
        success: true,
        message: `Time off entry with id ${time_off_id} deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DoctorController;
