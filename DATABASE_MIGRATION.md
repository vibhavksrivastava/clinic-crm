# Clinic CRM - Database Migration Checklist

## 🔄 Step-by-Step Migration Guide

### Before You Start
- [ ] Access to Supabase project (https://app.supabase.com)
- [ ] Backup existing data (if applicable)
- [ ] Read through entire schema_multi_clinic.sql
- [ ] Have approximately 5 minutes free time

---

## Migration Steps

### Step 1: Access SQL Editor
- [ ] Login to Supabase Dashboard
- [ ] Select your project
- [ ] Click **"SQL Editor"** in the left sidebar
- [ ] Click **"New Query"** button (top right)

### Step 2: Copy & Paste Schema
- [ ] Open file: `lib/db/schema_multi_clinic.sql`
- [ ] Select all content (Ctrl+A / Cmd+A)
- [ ] Copy content (Ctrl+C / Cmd+C)
- [ ] Paste into SQL Editor text area

### Step 3: Execute Migration
- [ ] Click **"Run"** button (or Cmd+Enter / Ctrl+Enter)
- [ ] Wait for query to complete
- [ ] Should see "Success" notification
- [ ] Check console for any errors

### Step 4: Verify Tables Created
- [ ] Go to **"Database"** section
- [ ] Click **"Tables"** in left sidebar
- [ ] Verify the following tables exist:
  - [ ] organizations
  - [ ] branches
  - [ ] roles
  - [ ] users
  - [ ] pharmacy_products
  - [ ] pharmacy_stock
  - [ ] pharmacy_transactions
  - [ ] whatsapp_messages
  - [ ] audit_logs
  - [ ] appointment_schedules
  - [ ] notification_settings

### Step 5: Seed Initial Roles
- [ ] Go back to SQL Editor
- [ ] Create a new query
- [ ] Copy and paste the roles seed script below
- [ ] Run the query

**Roles Seed Script:**
```sql
INSERT INTO roles (name, description, role_type, permissions, is_system_role)
VALUES 
  ('Super Admin', 'Full system access', 'super_admin', 
    '["manage_organization", "manage_branches", "manage_staff", "manage_patients", "manage_appointments", "manage_prescriptions", "manage_pharmacy", "manage_invoices", "manage_roles", "manage_billing", "view_analytics"]'::jsonb, true),
  
  ('Clinic Admin', 'Manage clinic and branches', 'clinic_admin', 
    '["manage_branches", "manage_staff", "manage_patients", "manage_appointments", "manage_prescriptions", "manage_pharmacy", "manage_invoices", "view_analytics"]'::jsonb, true),
  
  ('Branch Admin', 'Manage branch operations', 'branch_admin', 
    '["manage_staff", "manage_patients", "manage_appointments", "manage_prescriptions", "manage_pharmacy", "manage_invoices", "view_analytics"]'::jsonb, true),
  
  ('Doctor', 'Prescribe and manage patients', 'doctor', 
    '["manage_patients", "write_prescription", "view_analytics"]'::jsonb, true),
  
  ('Receptionist', 'Book appointments and billing', 'receptionist', 
    '["manage_patients", "book_appointment", "create_invoice", "view_analytics"]'::jsonb, true),
  
  ('Nurse', 'Patient records and vitals', 'nurse', 
    '["manage_patients", "view_analytics"]'::jsonb, true),
  
  ('Pharmacist', 'Manage pharmacy', 'pharmacist', 
    '["manage_pharmacy", "dispense_medication", "view_analytics"]'::jsonb, true);
```

- [ ] Verify you see "7 rows inserted" notification

### Step 6: Create First Organization (Optional for Testing)
```sql
INSERT INTO organizations (name, email, phone, address, city, country, subscription_plan)
VALUES 
  ('Test Clinic', 'test@clinic.com', '+1234567890', '123 Main St', 'New York', 'USA', 'basic');
```

- [ ] Run this query
- [ ] Copy the returned organization ID

### Step 7: Verify Migration Success
- [ ] Go to **"Tables"** → **"organizations"** → **"Data"** tab
- [ ] Should show the test organization you created (or be empty if skipped)
- [ ] Go to **"Tables"** → **"roles"** → **"Data"** tab
- [ ] Should show 7 roles that were seeded

---

## 🔍 Verification Queries

Run these queries to verify everything is set up correctly:

### Check Table Structure
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected output should include:
- appointments
- audit_logs
- branches
- doctor_schedule_frequency
- doctor_schedules
- invoices
- organization_id (in multiple tables)
- organizations
- patient_emergency_contacts
- patient_insurance
- patients
- pharmacy_products
- pharmacy_stock
- pharmacy_transactions
- prescriptions
- roles
- schedule_slots
- staff
- users
- whatsapp_messages

### Count Seeded Roles
```sql
SELECT COUNT(*) as role_count FROM roles;
```

Expected: **7 rows**

### Verify Indexes
```sql
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;
```

Should see many indexes with "idx_" prefix

---

## ⚠️ Common Issues & Solutions

### Issue: "Relation already exists"
**Cause:** Schema was already partially applied
**Solution:** 
1. Delete the problematic table
2. Re-run the migration
3. Or: Run only the missing DDL statements

### Issue: "Function gen_random_uuid() does not exist"
**Cause:** PostgreSQL version too old
**Solution:** Supabase uses pgcrypto extension - should be enabled automatically

### Issue: "Foreign key constraint violation"
**Cause:** Tables being dropped in wrong order
**Solution:** The migration file handles this - ensure it's the complete file

### Issue: "Permission denied"
**Cause:** Using incorrect role credentials
**Solution:** Use service role key, not anon key

### Issue: Roles insert fails with JSONB error
**Cause:** JSON format incorrect
**Solution:** Use the exact SQL provided above (with proper ::jsonb casting)

---

## 📊 Post-Migration Checklist

After migration is complete:

- [ ] All 10+ new tables created
- [ ] 7 roles seeded
- [ ] Foreign key relationships working
- [ ] Indexes created
- [ ] No errors in migration log
- [ ] Updated patients/staff/appointments tables with org/branch columns
- [ ] Database is in production-ready state

---

## 🔐 Security: Enable Row Level Security (RLS)

For production multi-tenant isolation:

1. Go to **"Authentication"** → **"Policies"** in Supabase
2. Enable RLS on these tables:
   - organizations
   - branches
   - users
   - patients
   - appointments
   - prescriptions
   - invoices

3. Create RLS policies:
```sql
-- Example policy for organizations
CREATE POLICY org_isolation ON organizations
  FOR ALL USING (
    auth.uid() = created_by 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.organization_id = organizations.id 
      AND users.id = auth.uid()
    )
  );
```

---

## ✅ Post-Migration Next Steps

1. **Update .env.local** with new variables
2. **Run `npm install`** to add dependencies
3. **Start dev server** with `npm run dev`
4. **Test authentication** endpoints
5. **Create admin dashboard** components
6. **Test multi-tenant isolation**

---

## 📝 Rollback Procedure (If Needed)

If something goes wrong:

```sql
-- Drop all new tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS whatsapp_messages CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS appointment_schedules CASCADE;
DROP TABLE IF EXISTS pharmacy_transactions CASCADE;
DROP TABLE IF EXISTS pharmacy_stock CASCADE;
DROP TABLE IF EXISTS pharmacy_products CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop added columns from existing tables
ALTER TABLE patients DROP COLUMN IF EXISTS organization_id;
ALTER TABLE patients DROP COLUMN IF EXISTS branch_id;
ALTER TABLE staff DROP COLUMN IF EXISTS organization_id;
ALTER TABLE staff DROP COLUMN IF EXISTS branch_id;
ALTER TABLE staff DROP COLUMN IF EXISTS user_id;
ALTER TABLE appointments DROP COLUMN IF EXISTS organization_id;
ALTER TABLE appointments DROP COLUMN IF EXISTS branch_id;
ALTER TABLE prescriptions DROP COLUMN IF EXISTS organization_id;
ALTER TABLE prescriptions DROP COLUMN IF EXISTS branch_id;
ALTER TABLE prescriptions DROP COLUMN IF EXISTS pharmacy_status;
ALTER TABLE prescriptions DROP COLUMN IF EXISTS dispensed_by_id;
ALTER TABLE prescriptions DROP COLUMN IF EXISTS dispensed_date;
ALTER TABLE invoices DROP COLUMN IF EXISTS organization_id;
ALTER TABLE invoices DROP COLUMN IF EXISTS branch_id;
```

---

## 📞 Getting Help

If migration fails:

1. **Check error message** - Usually indicates exact problem
2. **Copy-paste error** into Google search
3. **Check Supabase Status** - https://status.supabase.com
4. **Contact Supabase Support** - https://supabase.com/support

---

**Estimated Time:** 5-10 minutes
**Difficulty:** Easy ⭐⭐☆☆☆
**Risk Level:** Low (can be rolled back)

---

After completing this migration, proceed to **QUICK_START.md** for testing!
