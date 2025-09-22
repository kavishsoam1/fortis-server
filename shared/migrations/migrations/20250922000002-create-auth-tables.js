'use strict';

const { createTableInSchema } = require('../utils/schema-helpers');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create users table
    await createTableInSchema(queryInterface, 'users', 'auth', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(15),
        unique: true
      },
      email: {
        type: Sequelize.STRING(255),
        unique: true
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('patient', 'doctor', 'admin', 'staff'),
        defaultValue: 'patient'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_login: {
        type: Sequelize.DATE,
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

    // Create OTP table
    await createTableInSchema(queryInterface, 'otps', 'auth', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        },
        onDelete: 'CASCADE'
      },
      otp_code: {
        type: Sequelize.STRING(6),
        allowNull: false
      },
      purpose: {
        type: Sequelize.ENUM('verification', 'password_reset', 'login'),
        defaultValue: 'verification'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create user_sessions table
    await createTableInSchema(queryInterface, 'user_sessions', 'auth', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        },
        onDelete: 'CASCADE'
      },
      session_token: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false
      },
      device_info: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    // Drop tables in reverse order to avoid foreign key constraints
    await queryInterface.dropTable({ tableName: 'user_sessions', schema: 'auth' });
    await queryInterface.dropTable({ tableName: 'otps', schema: 'auth' });
    await queryInterface.dropTable({ tableName: 'users', schema: 'auth' });
  }
};
