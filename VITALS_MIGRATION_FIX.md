# Fix: Add Vitals Column to Prescriptions

## Problem
The vitals feature is failing because the `vitals` column doesn't exist in the `prescriptions` table in Supabase.

Error: `Could not find the 'vitals' column of 'prescriptions' in the schema cache`

## Solution

### Option 1: Run Migration via API (Easiest)

Run this command in your terminal:

```bash
curl -X POST http://localhost:3000/api/admin/migrations \
  -H "Authorization: Bearer migration-secret-key" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Migrations applied: Added appointment_type column and vitals column to prescriptions",
  "timestamp": "2026-05-02T08:15:00Z"
}
```

### Option 2: Run Migration Manually in Supabase

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Add vitals column to prescriptions table
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT NULL;

-- Create index for vitals queries
CREATE INDEX IF NOT EXISTS idx_prescriptions_vitals ON prescriptions USING GIN (vitals);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prescriptions' AND column_name = 'vitals';
```

5. Click **Run**
6. You should see success message: `Query executed successfully`

### Option 3: Run Node.js Migration Script

```bash
node -e "
const migrations = 'ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT NULL;';
console.log('To run this migration, use Supabase SQL Editor with:');
console.log(migrations);
"
```

## Verify the Fix

After running the migration, test by:

1. Log in as a doctor
2. Click on an ongoing appointment
3. Click **📊 Enter Vitals** button
4. Fill in vital signs (e.g., BP: 120/80, HR: 72)
5. Click **✓ Save Vitals**
6. You should see: ✅ Vitals saved successfully!

## What This Migration Does

- Adds a `vitals` JSONB column to store patient vital signs
- Creates a GIN index for efficient queries on the vitals data
- Stores the following vital information:
  - Blood pressure (systolic/diastolic) - mmHg
  - Heart rate - bpm
  - Temperature - Celsius/Fahrenheit
  - Oxygen saturation - %
  - Weight - kg/lbs
  - Height - cm/inches

## Vitals Data Structure

```json
{
  "blood_pressure_systolic": 120,
  "blood_pressure_diastolic": 80,
  "heart_rate": 72,
  "temperature": 98.6,
  "temperature_unit": "F",
  "oxygen_saturation": 98,
  "weight": 70.5,
  "weight_unit": "kg",
  "height": 175,
  "height_unit": "cm"
}
```

## Troubleshooting

- **Column already exists**: No problem, the `IF NOT EXISTS` clause prevents errors
- **Index creation fails**: The index is optional, vitals will still work
- **Still getting "vitals column not found" error**: 
  - Clear browser cache (Ctrl+Shift+Delete)
  - Restart the dev server
  - Refresh the page
