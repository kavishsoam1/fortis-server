const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * Registration Model
 * @typedef {Object} Registration
 * @property {number} id - Registration ID
 * @property {string} registration_id - Registration UUID
 * @property {string} member_id - Member ID (UUID)
 * @property {string} status - Registration status
 * @property {Object} registration_data - Registration form data
 * @property {string} verification_token - Email verification token
 * @property {Date} verification_expires - Token expiration date
 * @property {boolean} is_verified - Whether the registration is verified
 * @property {Date} created_at - Record creation timestamp
 * @property {Date} updated_at - Record last update timestamp
 */
const Registration = sequelize.define('Registration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  registration_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true
  },
  member_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'incomplete', 'completed', 'rejected', 'canceled']]
    }
  },
  registration_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'patient',
    validate: {
      isIn: [['patient', 'doctor', 'staff']]
    }
  },
  registration_data: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  verification_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'registrations',
  schema: 'registration',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Registration;
