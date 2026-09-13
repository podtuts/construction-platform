-- ==========================================================
-- ConstructPulse SaaS Construction Management
-- Supabase PostgreSQL Database Schema
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. App Settings (Company Branding, Name, Logo, Favicon)
CREATE TABLE IF NOT EXISTS company_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  company_name VARCHAR(255) NOT NULL DEFAULT 'ConstructPulse SaaS',
  logo_url TEXT NOT NULL DEFAULT '',
  favicon_url TEXT NOT NULL DEFAULT '',
  primary_color VARCHAR(20) DEFAULT '#0090FF',
  contact_email VARCHAR(255) DEFAULT 'support@constructpulse.io',
  currency_symbol VARCHAR(10) DEFAULT '₱',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('superuser', 'admin', 'user')),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  project_type VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  site_map_url TEXT,
  total_units INT NOT NULL DEFAULT 0,
  completed_units INT NOT NULL DEFAULT 0,
  target_completion_date DATE NOT NULL,
  budget DECIMAL(15, 2) DEFAULT 0,
  spent DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Units / Project Status Table
CREATE TABLE IF NOT EXISTS project_units (
  id VARCHAR(50) PRIMARY KEY,
  site_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
  unit_id VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status VARCHAR(50) NOT NULL CHECK (status IN ('Planning', 'Ongoing', 'T&C', 'Punchlist', 'Completed', 'Handover')),
  assigned_contractor VARCHAR(255),
  target_date DATE,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(50) PRIMARY KEY,
  equipment VARCHAR(255) NOT NULL,
  specs TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  site_id VARCHAR(50) REFERENCES projects(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Operational', 'Under Maintenance', 'Deployed', 'Standby', 'Decommissioned')),
  quantity INT DEFAULT 1,
  notes TEXT,
  last_inspected DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(150) NOT NULL,
  id_photo TEXT NOT NULL,
  mobile_no VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  sites TEXT[] NOT NULL DEFAULT '{}',
  department VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(50) PRIMARY KEY,
  site_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
  site_name VARCHAR(255) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Permit',
  status VARCHAR(50) NOT NULL CHECK (status IN ('Received', 'Approved', 'Handover')),
  uploaded_by VARCHAR(100),
  file_size VARCHAR(50),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Drawings Table
CREATE TABLE IF NOT EXISTS drawings (
  id VARCHAR(50) PRIMARY KEY,
  site_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
  site_name VARCHAR(255) NOT NULL,
  drawing_title VARCHAR(255) NOT NULL,
  system VARCHAR(50) NOT NULL CHECK (system IN ('Civil', 'Electrical', 'Mechanical', 'ELV', 'HVAC', 'Units', 'Exterior')),
  revision VARCHAR(20) DEFAULT 'Rev-01',
  status VARCHAR(50) NOT NULL CHECK (status IN ('Received', 'Approved', 'Handover')),
  architect_engineer VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(50) PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  category VARCHAR(50) DEFAULT 'General',
  user_name VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255) DEFAULT '',
  position VARCHAR(150) DEFAULT '',
  mobile_no VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Contractors Table
CREATE TABLE IF NOT EXISTS contractors (
  id VARCHAR(50) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  staff_count INT NOT NULL DEFAULT 0,
  site_id VARCHAR(50) REFERENCES projects(id) ON DELETE SET NULL,
  site_name VARCHAR(255) DEFAULT 'Unassigned',
  scope_of_work TEXT,
  contact_person VARCHAR(255) NOT NULL,
  contact_mobile_no VARCHAR(50) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
