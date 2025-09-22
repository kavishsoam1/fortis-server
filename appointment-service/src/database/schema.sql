-- Appointment Service Database Schema

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS appointment;

-- Appointments table
CREATE TABLE IF NOT EXISTS appointment.appointments (
  appointment_id UUID PRIMARY KEY,
  member_id UUID NOT NULL, -- Changed from patient_id to member_id
  hospital_guid TEXT,      -- Added hospital_guid
  doctor_id INTEGER NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  type VARCHAR(50) DEFAULT 'in_person', -- Added appointment type (in_person, video, etc.)
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_id UUID, -- Reference to payment in Payments service
  video_session_id UUID, -- Reference to video session in Video service
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata
  created_by UUID NOT NULL, -- User who created the appointment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointment audit table for tracking changes
CREATE TABLE IF NOT EXISTS appointment.appointment_audit (
  id SERIAL PRIMARY KEY,
  appointment_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- created, updated, cancelled, etc.
  old_values JSONB,
  new_values JSONB,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_member_id ON appointment.appointments(member_id);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital_guid ON appointment.appointments(hospital_guid);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointment.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointment.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointment.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointment.appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_id ON appointment.appointments(payment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_video_session_id ON appointment.appointments(video_session_id);
CREATE INDEX IF NOT EXISTS idx_appointment_audit_appointment_id ON appointment.appointment_audit(appointment_id);
