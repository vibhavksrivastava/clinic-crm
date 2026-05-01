-- =====================================================
-- APPOINTMENT MANAGEMENT ENHANCEMENT MIGRATION
-- =====================================================
-- This migration adds support for:
-- - Appointment fees and invoicing
-- - Prescription linking to appointments
-- - Payment tracking with methods (cash, card, UPI)
-- - Appointment status tracking (scheduled, ongoing, completed, cancelled)
-- =====================================================

-- =====================================================
-- 1. ENHANCE APPOINTMENTS TABLE
-- =====================================================
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT 'consultation', -- consultation, follow-up, procedure, etc.
ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS fee_description TEXT,
ADD COLUMN IF NOT EXISTS notes_from_doctor TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;

-- Add composite index for querying by status and date
CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments(status, appointment_date DESC);

-- =====================================================
-- 2. ENHANCE PRESCRIPTIONS TABLE
-- =====================================================
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_dispensed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dispensed_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS dispensed_by_id UUID REFERENCES staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status_date ON prescriptions(status, issued_date DESC);

-- =====================================================
-- 3. CREATE APPOINTMENT PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  amount_due DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  payment_method VARCHAR(50), -- cash, card, upi, cheque, bank_transfer
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid, overdue
  paid_date TIMESTAMP,
  paid_by_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  payment_reference VARCHAR(100), -- Transaction ID, Cheque No, etc.
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_appointments_payments_status ON appointment_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_payments_date ON appointment_payments(paid_date DESC);

-- =====================================================
-- 4. CREATE APPOINTMENT NOTES TABLE (for doctor/staff notes)
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  note_type VARCHAR(50) DEFAULT 'general', -- general, diagnosis, treatment, follow_up
  note_content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointment_notes_appointment ON appointment_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_notes_created ON appointment_notes(created_at DESC);

-- =====================================================
-- 5. CREATE APPOINTMENT STATUS LOG TABLE (for audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_logs_appointment ON appointment_status_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_status_logs_date ON appointment_status_logs(created_at DESC);

-- =====================================================
-- 6. UPDATE INVOICES TABLE TO LINK TO APPOINTMENTS
-- =====================================================
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_invoices_appointment ON invoices(appointment_id);

-- =====================================================
-- 7. PERMISSIONS AND ROLE-BASED ACCESS UPDATES
-- =====================================================
-- These are reference notes for role-based permissions

-- Doctor Role Permissions:
-- - view_appointments (their own upcoming/ongoing/completed)
-- - complete_appointment (mark as completed, add fees and notes)
-- - create_prescription (add prescription for patient)
-- - view_patient_details (full patient history)

-- Receptionist Role Permissions:
-- - view_appointments (all upcoming/ongoing/completed)
-- - create_appointment (schedule new appointment)
-- - cancel_appointment (cancel appointment)
-- - NOT: complete_appointment (only doctor can complete)
-- - view_prescription (see prescriptions from completed appointments)
-- - create_payment (mark fees as paid)
-- - view_fees (see appointment fees)

-- =====================================================
-- 8. SAMPLE DATA FOR TESTING
-- =====================================================
-- Insert test appointment statuses
-- Possible statuses: scheduled, ongoing, completed, cancelled, no-show, rescheduled

-- Ensure indexes are created for performance
VACUUM ANALYZE;
