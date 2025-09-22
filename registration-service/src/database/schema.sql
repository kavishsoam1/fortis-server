-- Patient Registration Service Database Schema

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS registration;

-- Patient Registry table
CREATE TABLE IF NOT EXISTS registration.patient_registry (
  id SERIAL PRIMARY KEY,
  member_id UUID NOT NULL,
  hospital_guid VARCHAR(100) UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, registered, failed
  registered_at TIMESTAMP WITH TIME ZONE,
  consent_flags JSONB DEFAULT '{}'::jsonb,
  external_payload JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Registration history table for auditing
CREATE TABLE IF NOT EXISTS registration.registration_history (
  id SERIAL PRIMARY KEY,
  member_id UUID NOT NULL,
  hospital_guid VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- create, update, sync, error
  event_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_registry_member_id ON registration.patient_registry(member_id);
CREATE INDEX IF NOT EXISTS idx_patient_registry_hospital_guid ON registration.patient_registry(hospital_guid);
CREATE INDEX IF NOT EXISTS idx_patient_registry_status ON registration.patient_registry(status);
CREATE INDEX IF NOT EXISTS idx_registration_history_member_id ON registration.registration_history(member_id);
CREATE INDEX IF NOT EXISTS idx_registration_history_hospital_guid ON registration.registration_history(hospital_guid);
