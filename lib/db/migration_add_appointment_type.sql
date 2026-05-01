-- Migration: Add appointment_type column to appointments table
-- This migration adds the missing appointment_type column that the API expects

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT 'consultation';

-- Create index for appointment_type for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
