'use strict';

const { createTableInSchema } = require('../utils/schema-helpers');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create members table
    await createTableInSchema(queryInterface, 'members', 'profile', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      member_id: {
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
        },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      profile_picture: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      address: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      emergency_contact: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      preferences: {
        type: Sequelize.JSONB,
        defaultValue: {}
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

    // Create member_health_data table
    await createTableInSchema(queryInterface, 'member_health_data', 'profile', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: {
            tableName: 'members',
            schema: 'profile'
          },
          key: 'member_id'
        },
        onDelete: 'CASCADE'
      },
      allergies: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      chronic_conditions: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      medications: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      blood_type: {
        type: Sequelize.STRING(5),
        allowNull: true
      },
      height_cm: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      smoking_status: {
        type: Sequelize.ENUM('never', 'former', 'current', 'unknown'),
        defaultValue: 'unknown'
      },
      alcohol_consumption: {
        type: Sequelize.ENUM('never', 'occasional', 'regular', 'unknown'),
        defaultValue: 'unknown'
      },
      exercise_frequency: {
        type: Sequelize.ENUM('sedentary', 'light', 'moderate', 'active', 'unknown'),
        defaultValue: 'unknown'
      },
      last_physical_exam: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      family_health_history: {
        type: Sequelize.JSONB,
        defaultValue: {}
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
    await queryInterface.dropTable({ tableName: 'member_health_data', schema: 'profile' });
    await queryInterface.dropTable({ tableName: 'members', schema: 'profile' });
  }
};
