'use strict';

const { createTableInSchema } = require('../utils/schema-helpers');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create invoices table
    await createTableInSchema(queryInterface, 'invoices', 'payment', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      invoice_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: {
            tableName: 'users',
            schema: 'auth'
          },
          key: 'user_id'
        }
      },
      appointment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: {
            tableName: 'appointments',
            schema: 'appointment'
          },
          key: 'appointment_id'
        },
        onDelete: 'SET NULL'
      },
      invoice_number: {
        type: Sequelize.STRING(20),
        unique: true,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD'
      },
      status: {
        type: Sequelize.ENUM('draft', 'pending', 'paid', 'partial', 'overdue', 'cancelled'),
        defaultValue: 'draft'
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      issued_date: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      },
      paid_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      invoice_items: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create payments table
    await createTableInSchema(queryInterface, 'payments', 'payment', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      payment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        allowNull: false
      },
      invoice_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: {
            tableName: 'invoices',
            schema: 'payment'
          },
          key: 'invoice_id'
        },
        onDelete: 'SET NULL'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: {
            tableName: 'users',
            schema: 'auth'
          },
          key: 'user_id'
        }
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD'
      },
      payment_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      payment_method: {
        type: Sequelize.ENUM('credit_card', 'debit_card', 'bank_transfer', 'cash', 'insurance', 'other'),
        allowNull: false
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
      },
      transaction_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      payment_details: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, /*Sequelize*/) {
    await queryInterface.dropTable({ tableName: 'payments', schema: 'payment' });
    await queryInterface.dropTable({ tableName: 'invoices', schema: 'payment' });
  }
};
