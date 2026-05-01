-- Add organization_id and branch_id to appointments table for multi-tenant support
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_organization_id ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_branch_id ON appointments(branch_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org_branch ON appointments(organization_id, branch_id);

-- Note: Existing appointments will have NULL organization_id and branch_id
-- They should be migrated or deleted based on business requirements
