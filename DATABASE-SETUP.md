# Database Setup Guide

This project uses Sequelize migrations to manage database schema changes. This guide will help you set up the database for the Health Services Microservices application.

## Prerequisites

- PostgreSQL 12 or higher
- Node.js 14 or higher
- npm 6 or higher

## Setting Up the Database

1. **Create a PostgreSQL database**

   ```bash
   createdb health_services
   ```

   Or using psql:
   ```bash
   psql -U postgres
   postgres=# CREATE DATABASE health_services;
   postgres=# \q
   ```

2. **Configure Environment Variables**

   Copy the sample `.env` file in the shared directory:

   ```bash
   cp shared/.env.example shared/.env
   ```

   Then edit the file to match your PostgreSQL configuration:

   ```
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=health_services
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password_here
   ```

3. **Run Migrations**

   From the project root directory, run:

   ```bash
   node migrate.js
   ```

   This will:
   - Check if required dependencies are installed
   - Run all migrations to create schemas and tables
   - Report the status of the migrations

## Database Structure

The database is organized into several schemas, each corresponding to a microservice:

1. **auth**: Authentication and user management
   - `users`: User accounts
   - `otps`: One-time passwords for verification
   - `user_sessions`: Active user sessions

2. **patient**: Patient information
   - `patients`: Patient records
   - `medical_records`: Patient medical history

3. **doctor**: Doctor information
   - `doctors`: Doctor records
   - `departments`: Hospital departments
   - `specialties`: Medical specialties
   - `schedules`: Doctor schedules
   - `time_off`: Doctor time off records

4. **appointment**: Appointment scheduling
   - `appointments`: Appointment records
   - `appointment_audit`: History of appointment changes

5. **profile**: User profiles
   - `members`: User profile information
   - `member_health_data`: Health information for members

6. **payment**: Payment processing
   - `invoices`: Invoice records
   - `payments`: Payment records

7. **registration**: Patient registration
   - `registrations`: Registration records
   - `documents`: Registration documents

## Working with Migrations

### Creating a New Migration

To create a new migration:

```bash
cd shared
npm run migrate:create -- --name add-new-field
```

This will create a new migration file in `shared/migrations/migrations/`.

### Running Migrations

To run all pending migrations:

```bash
cd shared
npm run migrate
```

### Undoing Migrations

To undo the most recent migration:

```bash
cd shared
npm run migrate:undo
```

To undo all migrations:

```bash
cd shared
npm run migrate:undo:all
```

## Database Seeding

To create seed data (for development):

```bash
cd shared
npm run seed:create -- --name add-sample-users
```

To run all seeders:

```bash
cd shared
npm run seed
```

## Integration with Microservices

Each microservice uses the Sequelize ORM to interact with its corresponding database schema. The shared Sequelize configuration ensures consistent database access across all services.
