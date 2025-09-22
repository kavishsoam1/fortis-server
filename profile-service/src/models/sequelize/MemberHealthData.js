const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * Member Health Data Model
 * @typedef {Object} MemberHealthData
 * @property {number} id - Health data ID
 * @property {string} member_id - Member ID (UUID)
 * @property {number} height_cm - Height in centimeters
 * @property {number} weight_kg - Weight in kilograms
 * @property {string} blood_type - Blood type
 * @property {Array} allergies - List of allergies
 * @property {Array} chronic_conditions - List of chronic conditions
 * @property {Array} medications - List of current medications
 * @property {Date} created_at - Record creation timestamp
 * @property {Date} updated_at - Record last update timestamp
 */
const MemberHealthData = sequelize.define('MemberHealthData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  member_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  height_cm: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  weight_kg: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  blood_type: {
    type: DataTypes.STRING(5),
    allowNull: true,
    validate: {
      isIn: [['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']]
    }
  },
  allergies: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  chronic_conditions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  medications: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  medical_history: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  family_history: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emergency_contact_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  emergency_contact_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  tableName: 'member_health_data',
  schema: 'profile',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = MemberHealthData;
