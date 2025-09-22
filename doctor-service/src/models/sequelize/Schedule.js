const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * Doctor Schedule Model
 * @typedef {Object} Schedule
 * @property {number} schedule_id - Schedule ID
 * @property {string} doctor_id - Doctor ID (UUID)
 * @property {number} day_of_week - Day of week (0-6, Sunday to Saturday)
 * @property {string} start_time - Start time (HH:MM format)
 * @property {string} end_time - End time (HH:MM format)
 * @property {boolean} is_available - Is the doctor available in this slot
 * @property {string} location - Location for appointments in this slot
 */
const Schedule = sequelize.define('Schedule', {
  schedule_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  doctor_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  day_of_week: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 6
    }
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'schedules',
  schema: 'doctor',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Schedule;
