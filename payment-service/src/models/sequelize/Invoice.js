const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * Invoice Model
 * @typedef {Object} Invoice
 * @property {number} id - Invoice ID
 * @property {string} invoice_id - Invoice unique ID (UUID)
 * @property {string} member_id - Member ID (reference to profile.members)
 * @property {number} appointment_id - Appointment ID (reference to appointment.appointments)
 * @property {number} total_amount - Total invoice amount
 * @property {number} paid_amount - Amount already paid
 * @property {string} currency - Currency code
 * @property {string} status - Invoice status
 * @property {Date} due_date - Due date for payment
 * @property {Date} created_at - Record creation timestamp
 * @property {Date} updated_at - Record last update timestamp
 */
const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoice_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true
  },
  member_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  invoice_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'paid', 'overdue', 'cancelled', 'partially_paid']]
    }
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'invoices',
  schema: 'payment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Invoice;
