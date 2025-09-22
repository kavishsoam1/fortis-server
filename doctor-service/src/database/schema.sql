-- Doctor Service Database Schema

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS doctor;

-- Departments table
CREATE TABLE IF NOT EXISTS doctor.departments (
  department_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Specialties table
CREATE TABLE IF NOT EXISTS doctor.specialties (
  specialty_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  department_id INTEGER REFERENCES doctor.departments(department_id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctor.doctors (
  id SERIAL PRIMARY KEY,
  doctor_id UUID NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  specialty_id INTEGER REFERENCES doctor.specialties(specialty_id),
  department_id INTEGER REFERENCES doctor.departments(department_id),
  license_number VARCHAR(50) NOT NULL UNIQUE,
  years_of_experience INTEGER,
  qualifications JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctor schedules table
CREATE TABLE IF NOT EXISTS doctor.schedules (
  schedule_id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctor.doctors(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Doctor time-off table
CREATE TABLE IF NOT EXISTS doctor.time_off (
  time_off_id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctor.doctors(id),
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_time_off_range CHECK (start_datetime < end_datetime)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctors_specialty_id ON doctor.doctors(specialty_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctor.doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_schedules_doctor_id ON doctor.schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_time_off_doctor_id ON doctor.time_off(doctor_id);
CREATE INDEX IF NOT EXISTS idx_time_off_date_range ON doctor.time_off(start_datetime, end_datetime);
