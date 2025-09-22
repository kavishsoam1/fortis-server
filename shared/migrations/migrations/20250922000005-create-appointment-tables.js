'use strict';

const { createTableInSchema } = require('../utils/schema-helpers');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create appointments table
    await createTableInSchema(queryInterface, 'appointments', 'appointment', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      appointment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        allowNull: false
      },
      member_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'patients',
            schema: 'patient'
          },
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      hospital_guid: {
        type: Sequelize.UUID,
        allowNull: true
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'doctors',
            schema: 'doctor'
          },
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      appointment_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 30
      },
      type: {
        type: Sequelize.ENUM('in_person', 'video', 'phone'),
        defaultValue: 'in_person'
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled'),
        defaultValue: 'scheduled'
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'paid', 'refunded', 'failed', 'waived'),
        defaultValue: 'pending'
      },
      payment_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      video_session_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      follow_up_appointment_id: {
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
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      created_by: {
        type: Sequelize.UUID,
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

    // Create appointment_audit table
    await createTableInSchema(queryInterface, 'appointment_audit', 'appointment', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      appointment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: {
            tableName: 'appointments',
            schema: 'appointment'
          },
          key: 'appointment_id'
        },
        onDelete: 'CASCADE'
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      old_values: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      new_values: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      changed_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      changed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, /*Sequelize*/) {
    await queryInterface.dropTable({ tableName: 'appointment_audit', schema: 'appointment' });
    await queryInterface.dropTable({ tableName: 'appointments', schema: 'appointment' });
  }
};
