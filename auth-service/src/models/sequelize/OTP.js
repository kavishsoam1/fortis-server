const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * OTP Model
 * @typedef {Object} OTP
 * @property {number} id - OTP ID
 * @property {string} phone - Phone number
 * @property {string} otp_hash - Hashed OTP
 * @property {Date} expires_at - Expiration timestamp
 * @property {Date} created_at - Record creation timestamp
 */
const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  otp_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'otp',
  schema: 'auth',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = OTP;
