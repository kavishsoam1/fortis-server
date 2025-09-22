const Payment = require('./Payment');
const Invoice = require('./Invoice');
const { testConnection } = require('../../../../shared/sequelize');

// Test database connection
testConnection();

// Define relationships
Invoice.hasMany(Payment, { foreignKey: 'invoice_id' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });

module.exports = {
  Payment,
  Invoice
};
