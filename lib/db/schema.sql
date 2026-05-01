-- Drop existing tables in correct order (due to foreign key constraints)
DROP TABLE IF EXISTS schedule_slots;
DROP TABLE IF EXISTS doctor_schedule_frequency;
DROP TABLE IF EXISTS doctor_schedules;
DROP TABLE IF EXISTS patient_emergency_contacts;
DROP TABLE IF EXISTS patient_insurance;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS patients;

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  date_of_birth DATE,
  address TEXT,
  organization_id UUID,
  branch_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Insurance Table
CREATE TABLE IF NOT EXISTS patient_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_name VARCHAR(100) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  group_number VARCHAR(100),
  coverage_type VARCHAR(50),
  effective_date DATE,
  expiry_date DATE,
  is_primary BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Emergency Contacts Table
CREATE TABLE IF NOT EXISTS patient_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  contact_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  priority INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  role VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  specialization VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctor Schedules Table (Main schedule template for each doctor)
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedule Frequency Table (Defines which days the schedule applies)
CREATE TABLE IF NOT EXISTS doctor_schedule_frequency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_schedule_id UUID NOT NULL REFERENCES doctor_schedules(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_schedule_id, day_of_week)
);

-- Schedule Slots Table (Generated slots for each day)
CREATE TABLE IF NOT EXISTS schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, slot_date, start_time)
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  schedule_slot_id UUID REFERENCES schedule_slots(id),
  appointment_date TIMESTAMP NOT NULL,
  appointment_type VARCHAR(50) DEFAULT 'consultation',
  duration_minutes INTEGER DEFAULT 30,
  status VARCHAR(20) DEFAULT 'scheduled',
  notes TEXT,
  organization_id UUID,
  branch_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  medications JSONB NOT NULL DEFAULT '[]',
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  organization_id UUID,
  branch_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_slot_id ON appointments(schedule_slot_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX idx_prescriptions_organization ON prescriptions(organization_id);
CREATE INDEX idx_prescriptions_branch ON prescriptions(branch_id);
CREATE INDEX idx_prescriptions_org_branch ON prescriptions(organization_id, branch_id);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_patient_insurance_patient_id ON patient_insurance(patient_id);
CREATE INDEX idx_patient_emergency_contacts_patient_id ON patient_emergency_contacts(patient_id);
CREATE INDEX idx_doctor_schedules_staff_id ON doctor_schedules(staff_id);
CREATE INDEX idx_schedule_frequency_schedule_id ON doctor_schedule_frequency(doctor_schedule_id);
CREATE INDEX idx_schedule_slots_staff_date ON schedule_slots(staff_id, slot_date);
CREATE INDEX idx_schedule_slots_available ON schedule_slots(is_available, slot_date);
