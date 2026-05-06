-- Migration: Add vitals and medicines columns to walk_ins table
-- This migration adds support for tracking patient vitals and medicines during walk-ins

-- Add vitals column (JSON array)
ALTER TABLE walk_ins
ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT '[]'::jsonb;

-- Add medicines column (JSON array)
ALTER TABLE walk_ins
ADD COLUMN IF NOT EXISTS medicines JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better query performance if needed
-- (Note: JSONB columns are indexed by the GIN index, but specific paths can be indexed too)
CREATE INDEX IF NOT EXISTS idx_walk_ins_vitals ON walk_ins USING GIN (vitals);
CREATE INDEX IF NOT EXISTS idx_walk_ins_medicines ON walk_ins USING GIN (medicines);

-- Update existing rows to have empty arrays (if they don't already)
UPDATE walk_ins SET vitals = '[]'::jsonb WHERE vitals IS NULL;
UPDATE walk_ins SET medicines = '[]'::jsonb WHERE medicines IS NULL;

-- Alter the table to add NOT NULL constraints (optional, depending on your requirements)
-- ALTER TABLE walk_ins ALTER COLUMN vitals SET NOT NULL;
-- ALTER TABLE walk_ins ALTER COLUMN medicines SET NOT NULL;
