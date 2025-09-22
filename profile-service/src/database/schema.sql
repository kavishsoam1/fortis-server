-- Profile Service Database Schema

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS profile;

-- Members table
CREATE TABLE IF NOT EXISTS profile.members (
  member_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  dob DATE,
  gender VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(100),
  address JSONB,
  relation_to_user VARCHAR(50),
  emergency_contact JSONB,
  hospital_guid VARCHAR(100),
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User-Member links table (if needed for more complex relationships)
CREATE TABLE IF NOT EXISTS profile.user_member_links (
  link_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  member_id UUID NOT NULL REFERENCES profile.members(member_id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  has_access_rights BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, member_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_members_user_id ON profile.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_hospital_guid ON profile.members(hospital_guid);
CREATE INDEX IF NOT EXISTS idx_user_member_links_user_id ON profile.user_member_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_member_links_member_id ON profile.user_member_links(member_id);
