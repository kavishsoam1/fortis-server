const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * Doctor Time Off Model
 * @typedef {Object} TimeOff
 * @property {number} time_off_id - Time off ID
 * @property {string} doctor_id - Doctor ID (UUID)
 * @property {Date} start_datetime - Start date and time
 * @property {Date} end_datetime - End date and time
 * @property {string} reason - Reason for time off
 */
const TimeOff = sequelize.define('TimeOff', {
  time_off_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  doctor_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  start_datetime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_datetime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'time_off',
  schema: 'doctor',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = TimeOff;
