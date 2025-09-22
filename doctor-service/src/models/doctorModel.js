const { Doctor, Department, Specialty, Schedule, TimeOff } = require('./sequelize');
const { sequelize } = require('../../../shared/sequelize');
const { Op } = require('sequelize');

class DoctorModel {
  /**
   * Create a new doctor record
   * @param {Object} doctorData - Doctor data
   * @returns {Promise<Object>} Created doctor
   */
  static async create(doctorData) {
    // Set default values if not provided
    if (doctorData.qualifications === undefined) {
      doctorData.qualifications = [];
    }
    if (doctorData.is_active === undefined) {
      doctorData.is_active = true;
    }
    
    // Create doctor with Sequelize
    const doctor = await Doctor.create(doctorData);
    return doctor;
  }
  
  /**
   * Get all doctors with optional pagination
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Number of records to skip
   * @returns {Promise<Array>} Array of doctors
   */
  static async findAll(limit = 100, offset = 0) {
    // Get all doctors with associated data
    const doctors = await Doctor.findAll({
      include: [
        {
          model: Specialty,
          attributes: ['name']
        },
        {
          model: Department,
          attributes: ['name']
        }
      ],
      where: {
        is_active: true
      },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    return doctors.map(doctor => {
      const plainDoctor = doctor.get({ plain: true });
      if (plainDoctor.Specialty) {
        plainDoctor.specialty_name = plainDoctor.Specialty.name;
      }
      if (plainDoctor.Department) {
        plainDoctor.department_name = plainDoctor.Department.name;
      }
      return plainDoctor;
    });
  }
  
  /**
   * Get doctor by ID
   * @param {string|number} id - Doctor ID or database ID
   * @param {boolean} useUUID - If true, search by doctor_id (UUID), else by id
   * @returns {Promise<Object|null>} Doctor data or null if not found
   */
  static async findById(id, useUUID = false) {
    // Find doctor by primary key or UUID
    const doctor = await Doctor.findOne({
      include: [
        {
          model: Specialty,
          attributes: ['name']
        },
        {
          model: Department,
          attributes: ['name']
        }
      ],
      where: useUUID ? { doctor_id: id } : { id: id }
    });
    
    if (!doctor) return null;
    
    const plainDoctor = doctor.get({ plain: true });
    if (plainDoctor.Specialty) {
      plainDoctor.specialty_name = plainDoctor.Specialty.name;
    }
    if (plainDoctor.Department) {
      plainDoctor.department_name = plainDoctor.Department.name;
    }
    
    return plainDoctor;
  }
  
  /**
   * Find doctors by specialty name
   * @param {string} specialtyName - Specialty name to search for
   * @returns {Promise<Array>} Array of doctors with the specified specialization
   */
  static async findBySpecialization(specialtyName) {
    // Find doctors by specialty name
    const doctors = await Doctor.findAll({
      include: [
        {
          model: Specialty,
          attributes: ['name'],
          where: {
            name: { [Op.iLike]: `%${specialtyName}%` }
          }
        },
        {
          model: Department,
          attributes: ['name']
        }
      ],
      where: {
        is_active: true
      },
      order: [
        ['years_of_experience', 'DESC'],
        ['created_at', 'ASC']
      ]
    });
    
    return doctors.map(doctor => {
      const plainDoctor = doctor.get({ plain: true });
      if (plainDoctor.Specialty) {
        plainDoctor.specialty_name = plainDoctor.Specialty.name;
      }
      if (plainDoctor.Department) {
        plainDoctor.department_name = plainDoctor.Department.name;
      }
      return plainDoctor;
    });
  }
  
  /**
   * Find doctors by department
   * @param {string} departmentName - Department name to search for
   * @returns {Promise<Array>} Array of doctors in the specified department
   */
  static async findByDepartment(departmentName) {
    // Find doctors by department name
    const doctors = await Doctor.findAll({
      include: [
        {
          model: Specialty,
          attributes: ['name']
        },
        {
          model: Department,
          attributes: ['name'],
          where: {
            name: { [Op.iLike]: `%${departmentName}%` }
          }
        }
      ],
      where: {
        is_active: true
      },
      order: [
        ['years_of_experience', 'DESC'],
        ['created_at', 'ASC']
      ]
    });
    
    return doctors.map(doctor => {
      const plainDoctor = doctor.get({ plain: true });
      if (plainDoctor.Specialty) {
        plainDoctor.specialty_name = plainDoctor.Specialty.name;
      }
      if (plainDoctor.Department) {
        plainDoctor.department_name = plainDoctor.Department.name;
      }
      return plainDoctor;
    });
  }
  
  /**
   * Update doctor by ID
   * @param {string|number} id - Doctor ID or database ID
   * @param {Object} doctorData - Updated doctor data
   * @param {boolean} useUUID - If true, search by doctor_id (UUID), else by id
   * @returns {Promise<Object|null>} Updated doctor or null if not found
   */
  static async update(id, doctorData, useUUID = false) {
    // Set where condition based on ID type
    const whereCondition = useUUID ? { doctor_id: id } : { id: id };
    
    // Update doctor with Sequelize
    const [updatedRowsCount, updatedRows] = await Doctor.update(doctorData, {
      where: whereCondition,
      returning: true
    });
    
    if (updatedRowsCount === 0) {
      return null;
    }
    
    return updatedRows[0];
  }
  
  /**
   * Soft delete doctor by ID (mark as inactive)
   * @param {string|number} id - Doctor ID or database ID
   * @param {boolean} useUUID - If true, search by doctor_id (UUID), else by id
   * @returns {Promise<boolean>} True if marked inactive, false if not found
   */
  static async delete(id, useUUID = false) {
    // Soft delete by setting is_active to false
    const whereCondition = useUUID ? { doctor_id: id } : { id: id };
    
    const [updatedRowsCount] = await Doctor.update(
      { is_active: false },
      { where: whereCondition }
    );
    
    return updatedRowsCount > 0;
  }
  
  /**
   * Add schedule for a doctor
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>} Created schedule
   */
  static async addSchedule(scheduleData) {
    // Set default values if not provided
    if (scheduleData.is_available === undefined) {
      scheduleData.is_available = true;
    }
    
    // Create schedule with Sequelize
    const schedule = await Schedule.create(scheduleData);
    return schedule;
  }
  
  /**
   * Get doctor's schedule
   * @param {number} doctorId - Doctor ID
   * @returns {Promise<Array>} Array of schedule entries
   */
  static async getSchedule(doctorId) {
    // Get doctor's schedule using Sequelize
    return await Schedule.findAll({
      where: { doctor_id: doctorId },
      order: [
        ['day_of_week', 'ASC'],
        ['start_time', 'ASC']
      ]
    });
  }
  
  /**
   * Add time off for a doctor
   * @param {Object} timeOffData - Time off data
   * @returns {Promise<Object>} Created time off entry
   */
  static async addTimeOff(timeOffData) {
    // Create time off record with Sequelize
    const timeOff = await TimeOff.create(timeOffData);
    return timeOff;
  }
  
  /**
   * Get doctor's appointments
   * @param {number} id - Doctor ID
   * @returns {Promise<Array>} Array of appointments
   */
  static async getAppointments(id) {
    // Get doctor's appointments using Sequelize associations
    const appointments = await sequelize.models.Appointment.findAll({
      where: { doctor_id: id },
      include: [
        {
          model: sequelize.models.Member,
          as: 'Member',
          attributes: ['name']
        }
      ],
      order: [['appointment_date', 'ASC']]
    });
    
    // Format the data to match the expected structure
    return appointments.map(appointment => {
      const plainAppointment = appointment.get({ plain: true });
      
      // Add formatted fields
      if (plainAppointment.Member) {
        plainAppointment.patient_name = plainAppointment.Member.name;
        delete plainAppointment.Member;
      }
      
      return plainAppointment;
    });
  }
  
  /**
   * Get doctor's appointments for a specific date range
   * @param {number} id - Doctor ID
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {Promise<Array>} Array of appointments in the date range
   */
  static async getAppointmentsByDateRange(id, startDate, endDate) {
    // Get doctor's appointments in date range using Sequelize associations
    const appointments = await sequelize.models.Appointment.findAll({
      where: {
        doctor_id: id,
        appointment_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: sequelize.models.Member,
          as: 'Member',
          attributes: ['name']
        }
      ],
      order: [['appointment_date', 'ASC']]
    });
    
    // Format the data to match the expected structure
    return appointments.map(appointment => {
      const plainAppointment = appointment.get({ plain: true });
      
      // Add formatted fields
      if (plainAppointment.Member) {
        plainAppointment.patient_name = plainAppointment.Member.name;
        delete plainAppointment.Member;
      }
      
      return plainAppointment;
    });
  }
  
  /**
   * Get doctor's time off periods
   * @param {number} doctorId - Doctor ID
   * @param {string} [startDate] - Optional start date in ISO format
   * @param {string} [endDate] - Optional end date in ISO format
   * @returns {Promise<Array>} Array of time off periods
   */
  static async getTimeOff(doctorId, startDate = null, endDate = null) {
    // Build where condition
    const whereCondition = { doctor_id: doctorId };
    
    if (startDate) {
      whereCondition.end_datetime = { [Op.gte]: startDate };
    }
    
    if (endDate) {
      whereCondition.start_datetime = { [Op.lte]: endDate };
    }
    
    // Get time off periods using Sequelize
    return await TimeOff.findAll({
      where: whereCondition,
      order: [['start_datetime', 'ASC']]
    });
  }
  
  // Department and Specialty methods
  
  /**
   * Get all departments
   * @returns {Promise<Array>} Array of departments
   */
  static async getAllDepartments() {
    // Get all active departments using Sequelize
    return await Department.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
  }
  
  /**
   * Get all specialties
   * @param {number} [departmentId] - Optional department ID filter
   * @returns {Promise<Array>} Array of specialties
   */
  static async getAllSpecialties(departmentId = null) {
    // Build where condition
    const whereCondition = { is_active: true };
    
    if (departmentId) {
      whereCondition.department_id = departmentId;
    }
    
    // Get specialties with department info using Sequelize
    const specialties = await Specialty.findAll({
      include: [{
        model: Department,
        attributes: ['name']
      }],
      where: whereCondition,
      order: [['name', 'ASC']]
    });
    
    return specialties.map(specialty => {
      const plainSpecialty = specialty.get({ plain: true });
      if (plainSpecialty.Department) {
        plainSpecialty.department_name = plainSpecialty.Department.name;
      }
      return plainSpecialty;
    });
  }
  
  /**
   * Create a new department
   * @param {Object} departmentData - Department data
   * @returns {Promise<Object>} Created department
   */
  static async createDepartment(departmentData) {
    // Set default values if not provided
    if (departmentData.is_active === undefined) {
      departmentData.is_active = true;
    }
    
    // Create department with Sequelize
    const department = await Department.create(departmentData);
    return department;
  }
  
  /**
   * Create a new specialty
   * @param {Object} specialtyData - Specialty data
   * @returns {Promise<Object>} Created specialty
   */
  static async createSpecialty(specialtyData) {
    // Set default values if not provided
    if (specialtyData.is_active === undefined) {
      specialtyData.is_active = true;
    }
    
    // Create specialty with Sequelize
    const specialty = await Specialty.create(specialtyData);
    return specialty;
  }
}

module.exports = DoctorModel;
