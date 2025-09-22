const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * Appointment Model
 * @typedef {Object} Appointment
 * @property {number} id - Appointment ID
 * @property {number} patient_id - Patient ID (reference to patients table)
 * @property {number} doctor_id - Doctor ID (reference to doctors table)
 * @property {Date} appointment_date - Date and time of appointment
 * @property {number} duration_minutes - Duration of appointment in minutes
 * @property {string} status - Appointment status (scheduled, completed, cancelled)
 * @property {string} notes - Notes about the appointment
 * @property {Date} created_at - Record creation timestamp
 * @property {Date} updated_at - Record last update timestamp
 */
const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appointment_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: {
        schema: 'patient',
        tableName: 'patients'
      },
      key: 'id'
    }
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: {
        schema: 'doctor',
        tableName: 'doctors'
      },
      key: 'id'
    }
  },
  appointment_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'scheduled',
    validate: {
      isIn: [['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']]
    }
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  follow_up_appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'appointments',
  schema: 'appointment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Appointment;
