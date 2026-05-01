-- =====================================================
-- CLINIC CRM MULTI-CLINIC/BRANCH SCHEMA
-- =====================================================
-- This migration adds support for:
-- - Multiple organizations (clinics)
-- - Multiple branches per clinic
-- - Multi-tenant data isolation
-- - Role-based access control
-- - Pharmacy module
-- =====================================================

-- =====================================================
-- 1. ORGANIZATIONS TABLE (Clinics)
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  subscription_plan VARCHAR(50) DEFAULT 'free', -- free, basic, premium, enterprise
  subscription_status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  max_staff INT DEFAULT 10,
  max_patients INT DEFAULT 1000,
  max_branches INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  UNIQUE(email)
);

-- =====================================================
-- 2. BRANCHES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  manager_id UUID, -- Will reference users table after creation
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, email)
);

-- =====================================================
-- 3. ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  role_type VARCHAR(50) NOT NULL, -- super_admin, clinic_admin, branch_admin, doctor, receptionist, nurse, pharmacist
  permissions JSONB DEFAULT '[]', -- Array of permission codes
  is_system_role BOOLEAN DEFAULT FALSE, -- Cannot be deleted if true
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, name)
);

-- =====================================================
-- 4. USERS TABLE (Replaces Staff)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(500),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  profile_picture_url VARCHAR(500),
  specialization VARCHAR(100), -- For doctors
  license_number VARCHAR(100), -- For doctors
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  user_status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  last_login TIMESTAMP,
  login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100), -- patients, appointments, prescriptions, etc.
  entity_id UUID,
  changes JSONB, -- Before/after values
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. UPDATE EXISTING TABLES WITH ORG/BRANCH
-- =====================================================

-- Patients
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_patients_organization ON patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_patients_branch ON patients(branch_id);

-- Staff (for backward compatibility)
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_organization ON staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_branch ON staff(branch_id);

-- Appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_organization ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_branch ON appointments(branch_id);

-- Prescriptions
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS pharmacy_status VARCHAR(50) DEFAULT 'pending', -- pending, dispensed, picked_up
ADD COLUMN IF NOT EXISTS dispensed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS dispensed_date TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_prescriptions_organization ON prescriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_branch ON prescriptions(branch_id);

-- Invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_branch ON invoices(branch_id);

-- =====================================================
-- 7. PHARMACY PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  category VARCHAR(100),
  unit_price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2),
  reorder_level INT DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  supplier_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_products_org ON pharmacy_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_products_branch ON pharmacy_products(branch_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_products_sku ON pharmacy_products(sku);

-- =====================================================
-- 8. PHARMACY STOCK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES pharmacy_products(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  batch_number VARCHAR(100),
  expiry_date DATE,
  supplier_id UUID,
  purchase_price DECIMAL(10, 2),
  purchase_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_product ON pharmacy_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_org_branch ON pharmacy_stock(organization_id, branch_id);

-- =====================================================
-- 9. PHARMACY TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES pharmacy_products(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- purchase, stock_in, stock_out, dispense, adjustment, return
  quantity INT NOT NULL,
  reference_id UUID, -- prescription_id, purchase_order_id, etc.
  performed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_transactions_org ON pharmacy_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_transactions_product ON pharmacy_transactions(product_id);

-- =====================================================
-- 10. APPOINTMENT SCHEDULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT DEFAULT 30,
  break_start TIME,
  break_end TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id, branch_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_schedules_doctor_org ON appointment_schedules(doctor_id, organization_id);

-- =====================================================
-- 11. NOTIFICATION SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  notification_type VARCHAR(100), -- appointment_reminder, prescription_ready, etc.
  enabled BOOLEAN DEFAULT TRUE,
  method VARCHAR(50), -- email, sms, whatsapp
  template JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 12. WHATSAPP INTEGRATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(100), -- appointment_confirmation, reminder, prescription_ready
  message_content TEXT,
  related_entity_id UUID, -- appointment_id, prescription_id, etc.
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, delivered
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_org ON whatsapp_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_status ON whatsapp_messages(status);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_org_branch ON users(organization_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_roles_organization ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_created ON organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_branches_organization ON branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
