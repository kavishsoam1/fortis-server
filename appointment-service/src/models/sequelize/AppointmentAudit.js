const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * Appointment Audit Model - For tracking appointment history
 * @typedef {Object} AppointmentAudit
 * @property {number} audit_id - Audit ID
 * @property {number} appointment_id - Appointment ID
 * @property {string} action - Action performed (create, update, cancel)
 * @property {Object} previous_state - Previous state of appointment
 * @property {Object} new_state - New state of appointment
 * @property {string} user_id - User who made the change
 * @property {Date} created_at - Record creation timestamp
 */
const AppointmentAudit = sequelize.define('AppointmentAudit', {
  audit_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['create', 'update', 'cancel', 'confirm', 'complete', 'no-show']]
    }
  },
  previous_state: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  new_state: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'appointment_audit',
  schema: 'appointment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = AppointmentAudit;
