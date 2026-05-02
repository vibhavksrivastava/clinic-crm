-- Migration: Add vitals column to prescriptions table
-- This migration adds support for storing vital signs with prescriptions

ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT NULL;

-- Create index for vitals queries
CREATE INDEX IF NOT EXISTS idx_prescriptions_vitals ON prescriptions USING GIN (vitals);

-- Add comment to document the vitals structure
COMMENT ON COLUMN prescriptions.vitals IS 'Stores patient vital signs: {blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, oxygen_saturation, weight, height, temperature_unit, weight_unit, height_unit}';
