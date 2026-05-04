-- Migration: Add doctor_id column to walk_ins table
-- This adds the ability to assign a doctor to walk-in records

-- Add doctor_id column if it doesn't exist
ALTER TABLE walk_ins 
ADD COLUMN IF NOT EXISTS doctor_id UUID;

-- Add foreign key constraint if it doesn't exist
ALTER TABLE walk_ins
ADD CONSTRAINT fk_walk_ins_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create index on doctor_id for performance
CREATE INDEX IF NOT EXISTS idx_walk_ins_doctor_id ON walk_ins(doctor_id);

-- Log the migration
SELECT 'Migration: Added doctor_id column to walk_ins table' as status;
