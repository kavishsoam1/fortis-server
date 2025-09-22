const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * Doctor Specialty Model
 * @typedef {Object} Specialty
 * @property {number} specialty_id - Specialty ID
 * @property {string} name - Specialty name
 * @property {string} description - Specialty description
 * @property {number} department_id - Department ID
 * @property {boolean} is_active - Is the specialty active
 */
const Specialty = sequelize.define('Specialty', {
  specialty_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'specialties',
  schema: 'doctor',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Specialty;
