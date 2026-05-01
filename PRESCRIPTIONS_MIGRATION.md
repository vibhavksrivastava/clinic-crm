# Prescriptions Table Migration: Switch to user_id

## Overview
This migration updates the `prescriptions` table to use `user_id` (from the `users` table) instead of `staff_id` (from the legacy `staff` table). This aligns the prescriptions table with the multi-tenant architecture.

## What Changed
- **Column**: `staff_id` → `user_id`
- **Foreign Key**: `staff(id)` → `users(id)`
- **New Columns**: `organization_id`, `branch_id`
- **Indexes**: Added multi-tenant and performance indexes

## API Updates
The prescriptions API at `/api/prescriptions` has been updated to:
- Use `user_id` instead of `staff_id` when creating/updating prescriptions
- Filter by `organization_id` and `branch_id` for multi-tenant access control
- Reference `users!user_id` relationship instead of `staff` relationship

## Database Migration Steps

### Step 1: Run Migration in Supabase SQL Editor
Copy and paste the following SQL into your Supabase SQL Editor and execute:

```sql
-- =====================================================
-- PRESCRIPTIONS TABLE MIGRATION: SWITCH TO USER_ID
-- =====================================================

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
```

### Step 2: Update Existing Records (Optional but Recommended)
If you have existing prescriptions with data, update them to include organization and branch IDs by linking them to the prescribing doctor's organization:

```sql
UPDATE prescriptions p
SET 
  organization_id = u.organization_id,
  branch_id = u.branch_id
FROM users u
WHERE p.user_id = u.id AND p.organization_id IS NULL;
```

## Files Updated
- `app/api/prescriptions/route.ts` - API endpoints now use user_id and multi-tenant filtering
- `lib/db/schema.sql` - Updated table definition for new databases
- `lib/db/migration_prescriptions_user_id.sql` - Migration SQL (saved for reference)

## Testing
After running the migration:
1. Start the dev server: `npm run dev`
2. Login as a doctor
3. Create a new prescription in an appointment
4. Verify the prescription is saved and can be viewed
5. Check that prescriptions are filtered by organization/branch

## Rollback (if needed)
If you need to rollback this migration:

```sql
-- Rename column back
ALTER TABLE prescriptions
RENAME COLUMN user_id TO staff_id;

-- Drop new constraint
ALTER TABLE prescriptions
DROP CONSTRAINT IF EXISTS prescriptions_user_id_fkey;

-- Add old constraint back (requires staff table to exist)
ALTER TABLE prescriptions
ADD CONSTRAINT prescriptions_staff_id_fkey 
  FOREIGN KEY (staff_id) REFERENCES staff(id);

-- Drop new indexes
DROP INDEX IF EXISTS idx_prescriptions_user_id;
DROP INDEX IF EXISTS idx_prescriptions_organization;
DROP INDEX IF EXISTS idx_prescriptions_branch;
DROP INDEX IF EXISTS idx_prescriptions_org_branch;

-- Drop new columns
ALTER TABLE prescriptions
DROP COLUMN IF EXISTS organization_id,
DROP COLUMN IF EXISTS branch_id;
```

## Notes
- The constraint is `ON DELETE RESTRICT` so you cannot delete users who have prescriptions
- The `appointment_id` column was also added to link prescriptions to appointments
- All API endpoints now filter by organization and branch for multi-tenant isolation
