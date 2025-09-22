const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * Payment Model
 * @typedef {Object} Payment
 * @property {string} payment_id - Payment ID (UUID)
 * @property {number} invoice_id - Invoice ID
 * @property {number} amount - Payment amount
 * @property {string} currency - Currency code
 * @property {string} payment_method - Payment method
 * @property {string} status - Payment status
 * @property {string} transaction_id - External transaction ID
 * @property {string} payment_provider - Payment provider (e.g., Stripe, PayPal)
 * @property {Date} payment_date - Date of payment
 * @property {Date} created_at - Record creation timestamp
 * @property {Date} updated_at - Record last update timestamp
 */
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  payment_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true
  },
  invoice_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['credit_card', 'debit_card', 'bank_transfer', 'cash', 'insurance', 'other']]
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'completed', 'failed', 'refunded', 'partially_refunded']]
    }
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  payment_provider: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'payments',
  schema: 'payment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Payment;
