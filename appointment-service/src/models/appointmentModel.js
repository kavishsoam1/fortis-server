const { Appointment, AppointmentAudit } = require('./sequelize');
const { sequelize } = require('../../../shared/sequelize');
const { Op } = require('sequelize');

/**
 * Appointment Model - Handles database operations for appointments
 */
class AppointmentModel {
  /**
   * Create a new appointment record
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  static async create(appointmentData) {
    // Set default values
    if (!appointmentData.duration_minutes) appointmentData.duration_minutes = 30;
    if (!appointmentData.type) appointmentData.type = 'in_person';
    if (!appointmentData.status) appointmentData.status = 'scheduled';
    if (!appointmentData.payment_status) appointmentData.payment_status = 'pending';
    if (!appointmentData.metadata) appointmentData.metadata = {};
    
    // Create appointment with Sequelize
    const appointment = await Appointment.create(appointmentData);
    return appointment;
  }
  
  /**
   * Get all appointments with optional pagination
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Number of records to skip
   * @returns {Promise<Array>} Array of appointments
   */
  static async findAll(limit = 100, offset = 0) {
    // Get appointments with associated doctor and patient data
    const appointments = await Appointment.findAll({
      include: [
        {
          model: sequelize.models.Patient,
          as: 'Patient',
          attributes: ['first_name', 'last_name']
        },
        {
          model: sequelize.models.Doctor,
          as: 'Doctor',
          attributes: ['first_name', 'last_name', 'specialization']
        }
      ],
      order: [['appointment_date', 'DESC']],
      limit,
      offset
    });
    
    // Format the data to match the expected structure
    return appointments.map(appointment => {
      const plainAppointment = appointment.get({ plain: true });
      
      // Add formatted fields
      if (plainAppointment.Patient) {
        plainAppointment.patient_first_name = plainAppointment.Patient.first_name;
        plainAppointment.patient_last_name = plainAppointment.Patient.last_name;
        delete plainAppointment.Patient;
      }
      
      if (plainAppointment.Doctor) {
        plainAppointment.doctor_first_name = plainAppointment.Doctor.first_name;
        plainAppointment.doctor_last_name = plainAppointment.Doctor.last_name;
        plainAppointment.doctor_specialization = plainAppointment.Doctor.specialization;
        delete plainAppointment.Doctor;
      }
      
      return plainAppointment;
    });
  }
  
  /**
   * Get appointment by ID
   * @param {string} id - Appointment ID
   * @returns {Promise<Object|null>} Appointment data or null if not found
   */
  static async findById(id) {
    // Get appointment with associated doctor and patient data
    const appointment = await Appointment.findOne({
      where: { appointment_id: id },
      include: [
        {
          model: sequelize.models.Patient,
          as: 'Patient',
          attributes: ['first_name', 'last_name']
        },
        {
          model: sequelize.models.Doctor,
          as: 'Doctor',
          attributes: ['first_name', 'last_name', 'specialization']
        }
      ]
    });
    
    if (!appointment) return null;
    
    // Format the data to match the expected structure
    const plainAppointment = appointment.get({ plain: true });
    
    // Add formatted fields
    if (plainAppointment.Patient) {
      plainAppointment.patient_first_name = plainAppointment.Patient.first_name;
      plainAppointment.patient_last_name = plainAppointment.Patient.last_name;
      delete plainAppointment.Patient;
    }
    
    if (plainAppointment.Doctor) {
      plainAppointment.doctor_first_name = plainAppointment.Doctor.first_name;
      plainAppointment.doctor_last_name = plainAppointment.Doctor.last_name;
      plainAppointment.doctor_specialization = plainAppointment.Doctor.specialization;
      delete plainAppointment.Doctor;
    }
    
    return plainAppointment;
  }
  
  /**
   * Get appointments by doctor ID
   * @param {number} doctorId - Doctor ID
   * @param {string} [startDate] - Optional start date filter
   * @param {string} [endDate] - Optional end date filter
   * @returns {Promise<Array>} Array of appointments
   */
  static async findByDoctorId(doctorId, startDate, endDate) {
    // Build where condition
    const whereCondition = { doctor_id: doctorId };
    
    if (startDate && endDate) {
      whereCondition.appointment_date = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    // Get appointments with associated patient data
    const appointments = await Appointment.findAll({
      where: whereCondition,
      include: [
        {
          model: sequelize.models.Patient,
          as: 'Patient',
          attributes: ['first_name', 'last_name']
        }
      ],
      order: [['appointment_date', 'ASC']]
    });
    
    // Format the data to match the expected structure
    return appointments.map(appointment => {
      const plainAppointment = appointment.get({ plain: true });
      
      // Add formatted fields
      if (plainAppointment.Patient) {
        plainAppointment.patient_first_name = plainAppointment.Patient.first_name;
        plainAppointment.patient_last_name = plainAppointment.Patient.last_name;
        delete plainAppointment.Patient;
      }
      
      return plainAppointment;
    });
  }
  
  /**
   * Get appointments by patient ID
   * @param {number} memberId - Patient ID
   * @param {string} [startDate] - Optional start date filter
   * @param {string} [endDate] - Optional end date filter
   * @returns {Promise<Array>} Array of appointments
   */
  static async findByPatientId(memberId, startDate, endDate) {
    // Build where condition
    const whereCondition = { member_id: memberId };
    
    if (startDate && endDate) {
      whereCondition.appointment_date = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    // Get appointments with associated doctor data
    const appointments = await Appointment.findAll({
      where: whereCondition,
      include: [
        {
          model: sequelize.models.Doctor,
          as: 'Doctor',
          attributes: ['first_name', 'last_name', 'specialization']
        }
      ],
      order: [['appointment_date', 'ASC']]
    });
    
    // Format the data to match the expected structure
    return appointments.map(appointment => {
      const plainAppointment = appointment.get({ plain: true });
      
      // Add formatted fields
      if (plainAppointment.Doctor) {
        plainAppointment.doctor_first_name = plainAppointment.Doctor.first_name;
        plainAppointment.doctor_last_name = plainAppointment.Doctor.last_name;
        plainAppointment.doctor_specialization = plainAppointment.Doctor.specialization;
        delete plainAppointment.Doctor;
      }
      
      return plainAppointment;
    });
  }
  
  /**
   * Get appointments by status
   * @param {string} status - Appointment status
   * @returns {Promise<Array>} Array of appointments
   */
  static async findByStatus(status) {
    // Get appointments with associated doctor and patient data
    const appointments = await Appointment.findAll({
      where: { status },
      include: [
        {
          model: sequelize.models.Patient,
          as: 'Patient',
          attributes: ['first_name', 'last_name']
        },
        {
          model: sequelize.models.Doctor,
          as: 'Doctor',
          attributes: ['first_name', 'last_name', 'specialization']
        }
      ],
      order: [['appointment_date', 'ASC']]
    });
    
    // Format the data to match the expected structure
    return appointments.map(appointment => {
      const plainAppointment = appointment.get({ plain: true });
      
      // Add formatted fields
      if (plainAppointment.Patient) {
        plainAppointment.patient_first_name = plainAppointment.Patient.first_name;
        plainAppointment.patient_last_name = plainAppointment.Patient.last_name;
        delete plainAppointment.Patient;
      }
      
      if (plainAppointment.Doctor) {
        plainAppointment.doctor_first_name = plainAppointment.Doctor.first_name;
        plainAppointment.doctor_last_name = plainAppointment.Doctor.last_name;
        plainAppointment.doctor_specialization = plainAppointment.Doctor.specialization;
        delete plainAppointment.Doctor;
      }
      
      return plainAppointment;
    });
  }
  
  /**
   * Get appointments by date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Array of appointments
   */
  static async findByDateRange(startDate, endDate) {
    // Get appointments with associated doctor and patient data
    const appointments = await Appointment.findAll({
      where: {
        appointment_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: sequelize.models.Patient,
          as: 'Patient',
          attributes: ['first_name', 'last_name']
        },
        {
          model: sequelize.models.Doctor,
          as: 'Doctor',
          attributes: ['first_name', 'last_name', 'specialization']
        }
      ],
      order: [['appointment_date', 'ASC']]
    });
    
    // Format the data to match the expected structure
    return appointments.map(appointment => {
      const plainAppointment = appointment.get({ plain: true });
      
      // Add formatted fields
      if (plainAppointment.Patient) {
        plainAppointment.patient_first_name = plainAppointment.Patient.first_name;
        plainAppointment.patient_last_name = plainAppointment.Patient.last_name;
        delete plainAppointment.Patient;
      }
      
      if (plainAppointment.Doctor) {
        plainAppointment.doctor_first_name = plainAppointment.Doctor.first_name;
        plainAppointment.doctor_last_name = plainAppointment.Doctor.last_name;
        plainAppointment.doctor_specialization = plainAppointment.Doctor.specialization;
        delete plainAppointment.Doctor;
      }
      
      return plainAppointment;
    });
  }
  
  /**
   * Update appointment by ID
   * @param {string} id - Appointment ID
   * @param {Object} appointmentData - Updated appointment data
   * @param {string} userId - User ID making the update (for audit)
   * @returns {Promise<Object|null>} Updated appointment or null if not found
   */
  static async update(id, appointmentData, userId) {
    // Get the original appointment for audit
    const originalAppointment = await this.findById(id);
    
    if (!originalAppointment) {
      return null; // Appointment not found
    }
    
    // Update appointment with Sequelize
    const [updatedRowsCount, updatedRows] = await Appointment.update(appointmentData, {
      where: { appointment_id: id },
      returning: true
    });
    
    if (updatedRowsCount === 0) {
      return null;
    }
    
    const updatedAppointment = updatedRows[0];
    
    // Create audit record for the update
    await this.createAuditRecord({
      appointment_id: id,
      action: 'updated',
      old_values: originalAppointment,
      new_values: updatedAppointment,
      changed_by: userId
    });
    
    return updatedAppointment;
  }
  
  /**
   * Update appointment status
   * @param {string} id - Appointment ID
   * @param {string} status - New status
   * @param {string} userId - User ID making the change
   * @returns {Promise<Object|null>} Updated appointment or null if not found
   */
  static async updateStatus(id, status, userId) {
    // Get the original appointment for audit
    const originalAppointment = await this.findById(id);
    
    if (!originalAppointment) {
      return null;
    }
    
    // Update appointment with Sequelize
    const [updatedRowsCount, updatedRows] = await Appointment.update(
      { status },
      { 
        where: { appointment_id: id },
        returning: true 
      }
    );
    
    if (updatedRowsCount > 0) {
      const updatedAppointment = updatedRows[0];
      
      // Create audit record
      await this.createAuditRecord({
        appointment_id: id,
        action: 'status_updated',
        old_values: { status: originalAppointment.status },
        new_values: { status },
        changed_by: userId
      });
      
      // Emit event (in real implementation, this would use a message broker)
      console.log(`Event: appointment.${status}, appointment_id: ${id}`);
      
      return updatedAppointment;
    }
    
    return null;
  }
  
  /**
   * Delete appointment by ID
   * @param {string} id - Appointment ID
   * @param {string} userId - User ID making the deletion
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id, userId) {
    // Get the appointment before deletion for audit
    const appointment = await this.findById(id);
    
    if (!appointment) {
      return false;
    }
    
    // Delete appointment with Sequelize
    const deletedCount = await Appointment.destroy({
      where: { appointment_id: id }
    });
    
    if (deletedCount > 0) {
      // Create audit record
      await this.createAuditRecord({
        appointment_id: id,
        action: 'deleted',
        old_values: appointment,
        new_values: null,
        changed_by: userId
      });
      
      // Emit event (in real implementation, this would use a message broker)
      console.log(`Event: appointment.cancelled, appointment_id: ${id}`);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Check for appointment conflicts
   * @param {number} doctorId - Doctor ID
   * @param {Date} appointmentDate - Appointment date and time
   * @param {number} durationMinutes - Duration of the appointment in minutes
   * @param {string} [excludeAppointmentId] - Optional ID to exclude from conflict check
   * @returns {Promise<boolean>} True if conflict exists, false otherwise
   */
  static async checkForConflicts(doctorId, appointmentDate, durationMinutes, excludeAppointmentId = null) {
    const appointmentEndTime = new Date(new Date(appointmentDate).getTime() + durationMinutes * 60000);
    const appointmentDateObj = new Date(appointmentDate);
    
    // Need to use raw query for this complex time-based check
    // This is one of the few cases where raw SQL is necessary due to the complexity
    // of the time range calculation that's difficult to express in Sequelize
    
    // This query checks if there are any appointments for the doctor that overlap with the proposed time
    const [results] = await sequelize.query(`
      SELECT COUNT(*) AS count 
      FROM appointment.appointments 
      WHERE doctor_id = :doctorId
        AND status != 'cancelled'
        AND (
          (appointment_date <= :appointmentDate AND appointment_date + (duration_minutes * interval '1 minute') > :appointmentDate)
          OR
          (appointment_date < :appointmentEndTime AND appointment_date + (duration_minutes * interval '1 minute') >= :appointmentEndTime)
          OR
          (appointment_date >= :appointmentDate AND appointment_date < :appointmentEndTime)
        )
        ${excludeAppointmentId ? 'AND appointment_id != :excludeAppointmentId' : ''}
    `, {
      replacements: { 
        doctorId, 
        appointmentDate: appointmentDateObj, 
        appointmentEndTime,
        excludeAppointmentId
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    return parseInt(results[0].count) > 0;
  }
  
  /**
   * Update payment status
   * @param {string} id - Appointment ID
   * @param {string} paymentStatus - New payment status
   * @param {string} paymentId - Payment ID (optional)
   * @param {string} userId - User ID making the change
   * @returns {Promise<Object|null>} Updated appointment or null if not found
   */
  static async updatePaymentStatus(id, paymentStatus, paymentId, userId) {
    // Get the original appointment for audit
    const originalAppointment = await this.findById(id);
    
    if (!originalAppointment) {
      return null;
    }
    
    // Update appointment with Sequelize
    const [updatedRowsCount, updatedRows] = await Appointment.update(
      { payment_status: paymentStatus, payment_id: paymentId },
      { 
        where: { appointment_id: id },
        returning: true 
      }
    );
    
    if (updatedRowsCount > 0) {
      const updatedAppointment = updatedRows[0];
      
      // Create audit record
      await this.createAuditRecord({
        appointment_id: id,
        action: 'payment_updated',
        old_values: { 
          payment_status: originalAppointment.payment_status,
          payment_id: originalAppointment.payment_id 
        },
        new_values: { payment_status: paymentStatus, payment_id: paymentId },
        changed_by: userId
      });
      
      // Emit event (in real implementation, this would use a message broker)
      console.log(`Event: appointment.payment.${paymentStatus}, appointment_id: ${id}`);
      
      return updatedAppointment;
    }
    
    return null;
  }
  
  /**
   * Get available slots for a doctor by specialty
   * @param {string} specialty - Doctor specialization
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {Promise<Array>} Array of available slots
   */
  static async getAvailableSlots(specialty, startDate, endDate) {
    // This is a simplified implementation
    // In a real system, this would consider doctor schedules, existing appointments,
    // slot durations, working hours, etc.
    
    // This query requires the generate_series PostgreSQL function and complex time calculations
    // which are not directly expressible in Sequelize ORM, so we use a raw query
    // but with proper sanitization through parameterized queries
    const slots = await sequelize.query(`
      WITH time_slots AS (
        SELECT generate_series(
          :startDate::timestamp,
          :endDate::timestamp,
          interval '30 minutes'
        ) as slot_time
      ),
      doctors_with_specialty AS (
        SELECT 
          d.id as doctor_id,
          d.first_name,
          d.last_name,
          d.specialization,
          d.years_of_experience
        FROM doctor.doctors d
        WHERE d.specialization ILIKE :specialty AND d.is_active = true
      )
      SELECT 
        d.doctor_id,
        d.first_name,
        d.last_name,
        d.specialization,
        t.slot_time
      FROM doctors_with_specialty d
      CROSS JOIN time_slots t
      WHERE NOT EXISTS (
        SELECT 1 FROM appointment.appointments a
        WHERE a.doctor_id = d.doctor_id
          AND a.status != 'cancelled'
          AND a.appointment_date <= t.slot_time
          AND a.appointment_date + (a.duration_minutes * interval '1 minute') > t.slot_time
      )
      ORDER BY t.slot_time, d.years_of_experience DESC
    `, {
      replacements: { 
        specialty: `%${specialty}%`, 
        startDate, 
        endDate 
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    return slots;
  }
  
  /**
   * Create an audit record for appointment changes
   * @param {Object} auditData - Audit data
   * @returns {Promise<Object>} Created audit record
   */
  static async createAuditRecord(auditData) {
    // Create audit record with Sequelize
    const auditRecord = await AppointmentAudit.create({
      appointment_id: auditData.appointment_id,
      action: auditData.action,
      old_values: auditData.old_values,
      new_values: auditData.new_values,
      changed_by: auditData.changed_by
    });
    
    return auditRecord;
  }
  
  /**
   * Get audit history for an appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Array>} Array of audit records
   */
  static async getAuditHistory(appointmentId) {
    // Get audit history with Sequelize
    const auditRecords = await AppointmentAudit.findAll({
      where: { appointment_id: appointmentId },
      order: [['changed_at', 'DESC']]
    });
    
    return auditRecords;
  }
}

module.exports = AppointmentModel;
