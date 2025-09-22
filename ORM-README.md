# Sequelize ORM for Health Services Microservices

This document explains how to use the Sequelize ORM models implemented across all microservices in the project.

## Overview

Each microservice now has Sequelize ORM models located in `src/models/sequelize/` which provide a more structured, type-safe approach to database operations.

## Shared Sequelize Configuration

The core Sequelize configuration is centralized in `shared/sequelize.js` and provides:

- A configured Sequelize instance
- Connection management
- Logging configuration

## Using Models in Your Code

### Importing Models

To use models in your controllers or services:

```javascript
// Import specific models
const { Patient } = require('../models/sequelize');

// Or import the whole model index
const models = require('../models/sequelize');
```

### Basic CRUD Operations

#### Create

```javascript
// Create a new record
const newPatient = await Patient.create({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  date_of_birth: '1990-01-15',
  // other fields...
});
```

#### Read

```javascript
// Find one by primary key
const patient = await Patient.findByPk(1);

// Find one with conditions
const patient = await Patient.findOne({
  where: { email: 'john.doe@example.com' }
});

// Find all matching a condition
const patients = await Patient.findAll({
  where: {
    date_of_birth: {
      [Op.gte]: new Date('1990-01-01')
    }
  },
  limit: 10,
  offset: 0
});
```

#### Update

```javascript
// Update a record
await Patient.update(
  { phone: '+1234567890' },
  { 
    where: { id: 1 }
  }
);

// Or update an instance
const patient = await Patient.findByPk(1);
patient.phone = '+1234567890';
await patient.save();
```

#### Delete

```javascript
// Delete by condition
await Patient.destroy({
  where: { id: 1 }
});

// Or delete an instance
const patient = await Patient.findByPk(1);
await patient.destroy();
```

### Using Associations

Models have associations defined between them. Use these to perform joins:

```javascript
// Get a doctor with all their schedules
const doctor = await Doctor.findByPk(1, {
  include: Schedule
});

// Get appointments with doctor and patient info
const appointments = await Appointment.findAll({
  include: [
    { model: Doctor },
    { model: Patient }
  ]
});
```

## Transaction Support

Use transactions to ensure data integrity:

```javascript
const { sequelize } = require('../../../../shared/sequelize');

// Using async/await
const transaction = await sequelize.transaction();

try {
  const patient = await Patient.create(
    { /* patient data */ },
    { transaction }
  );
  
  const appointment = await Appointment.create(
    { 
      patient_id: patient.id,
      /* other appointment data */
    },
    { transaction }
  );
  
  await transaction.commit();
  return { patient, appointment };
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## Migrations (Future Enhancement)

Consider implementing Sequelize migrations for schema changes. This would involve:

1. Setting up a migrations folder
2. Creating migration scripts
3. Using Sequelize CLI to run migrations

## Model Validation

Models include validation rules to ensure data integrity:

```javascript
// Example validation in User model
email: {
  type: DataTypes.STRING(255),
  allowNull: true,
  unique: true,
  validate: {
    isEmail: true
  }
}
```

## Database Connection

Database connection is tested at startup in each model index.js:

```javascript
// Test database connection
testConnection();
```
