-- =====================================================
-- PRESCRIPTIONS TABLE MIGRATION: SWITCH TO USER_ID
-- =====================================================
-- This migration updates the prescriptions table to use user_id
-- (from users table) instead of staff_id (from staff table)
-- to align with multi-tenant architecture

-- 1. Drop the old foreign key constraint
ALTER TABLE prescriptions
DROP CONSTRAINT IF EXISTS prescriptions_staff_id_fkey;

-- 2. Rename staff_id to user_id
ALTER TABLE prescriptions
RENAME COLUMN staff_id TO user_id;

-- 3. Add the new foreign key constraint
ALTER TABLE prescriptions
ADD CONSTRAINT prescriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- 4. Add multi-tenant columns if not already present
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- 5. Create indexes for multi-tenant and performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_organization ON prescriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_branch ON prescriptions(branch_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_org_branch ON prescriptions(organization_id, branch_id);

-- 6. Update schema.sql to reflect the new structure (manual step)
-- The schema.sql file should be updated to show staff_id as user_id for new databases
