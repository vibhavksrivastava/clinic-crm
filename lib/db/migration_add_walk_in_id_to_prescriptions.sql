-- Migration: Add walk_in_id to prescriptions table
-- Purpose: Link prescriptions to walk-ins for automatic prescription generation

-- Add walk_in_id column to prescriptions table
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS walk_in_id UUID REFERENCES walk_ins(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_walk_in_id 
ON prescriptions(walk_in_id);

-- Add composite index for organization and walk_in filtering
CREATE INDEX IF NOT EXISTS idx_prescriptions_walk_in_org 
ON prescriptions(organization_id, walk_in_id);

-- Add branch index if needed
CREATE INDEX IF NOT EXISTS idx_prescriptions_walk_in_branch 
ON prescriptions(branch_id, walk_in_id) 
WHERE branch_id IS NOT NULL;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prescriptions' 
  AND column_name IN ('walk_in_id', 'appointment_id')
ORDER BY ordinal_position;
