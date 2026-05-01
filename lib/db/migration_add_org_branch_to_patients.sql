-- Add organization_id and branch_id to patients table for multi-tenant support
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_organization_id ON patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_patients_branch_id ON patients(branch_id);
CREATE INDEX IF NOT EXISTS idx_patients_org_branch ON patients(organization_id, branch_id);

-- Note: Existing patients will have NULL organization_id and branch_id
-- Migration script (run separately if needed):
-- UPDATE patients SET organization_id = (SELECT organization_id FROM users WHERE id = <receptionist_user_id>) 
-- WHERE organization_id IS NULL;
