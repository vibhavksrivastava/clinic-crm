-- Migration: Add walk_ins table for tracking clinic walk-ins
-- This table tracks patients who walk into the clinic without appointments

CREATE TABLE IF NOT EXISTS walk_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Patient information (name required, patient_id optional if they exist in system)
  patient_id UUID,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  
  -- Walk-in status and timing
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  check_in_time TIMESTAMP DEFAULT NOW(),
  check_out_time TIMESTAMP,
  
  -- Additional tests recommended (JSON array for flexibility)
  additional_tests JSONB DEFAULT '[]'::jsonb,
  
  -- Notes/remarks about the walk-in
  notes TEXT,
  
  -- Staff information
  created_by UUID NOT NULL, -- receptionist/doctor who created the walk-in
  updated_by UUID, -- staff who marked as complete
  doctor_id UUID, -- assigned doctor for the walk-in
  
  -- Organization and branch information
  organization_id UUID NOT NULL,
  branch_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_walk_ins_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  CONSTRAINT fk_walk_ins_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_walk_ins_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_walk_ins_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_walk_ins_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_walk_ins_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE INDEX idx_walk_ins_organization_id ON walk_ins(organization_id);
CREATE INDEX idx_walk_ins_branch_id ON walk_ins(branch_id);
CREATE INDEX idx_walk_ins_patient_id ON walk_ins(patient_id);
CREATE INDEX idx_walk_ins_doctor_id ON walk_ins(doctor_id);
CREATE INDEX idx_walk_ins_status ON walk_ins(status);
CREATE INDEX idx_walk_ins_check_in_time ON walk_ins(check_in_time);
CREATE INDEX idx_walk_ins_created_by ON walk_ins(created_by);
CREATE INDEX idx_walk_ins_created_at ON walk_ins(created_at);

-- Index for reporting queries (organization + date range)
CREATE INDEX idx_walk_ins_org_date ON walk_ins(organization_id, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE walk_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see walk-ins from their organization
CREATE POLICY walk_ins_org_access ON walk_ins
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can insert walk-ins for their organization
CREATE POLICY walk_ins_org_insert ON walk_ins
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can update walk-ins in their organization
CREATE POLICY walk_ins_org_update ON walk_ins
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
