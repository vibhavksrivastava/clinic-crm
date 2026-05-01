# Appointment Type Column Migration

## Problem
The appointments table is missing the `appointment_type` column that the API expects when creating appointments.

## Solution
Run the following SQL in your Supabase SQL Editor to add the missing column.

## Steps to Apply Migration

### 1. Open Supabase SQL Editor
- Go to https://app.supabase.com
- Select your project (clinic-crm)
- Click **"SQL Editor"** in the left sidebar
- Click **"New Query"** button

### 2. Copy & Execute This SQL
```sql
-- Add appointment_type column to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT 'consultation';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
```

### 3. Click "Run" Button
- Wait for the query to complete
- You should see "Success" notification

### 4. Verify Success
- The appointments table now has the `appointment_type` column
- Future appointments will have a type (default: 'consultation')

## Alternative: Via Next.js Route

If you have the `ADMIN_MIGRATION_KEY` environment variable set, you can also trigger the migration via:

```bash
# In PowerShell:
$migrationKey = "your-migration-key"
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/migrations" `
  -Method POST `
  -Headers @{Authorization="Bearer $migrationKey"} `
  -ContentType "application/json"
```

## What This Fixes
- ✅ Appointment creation will no longer fail with "Could not find 'appointment_type' column" error
- ✅ Appointments will be stored with their type for better tracking
- ✅ Appointment type filtering will work in queries
