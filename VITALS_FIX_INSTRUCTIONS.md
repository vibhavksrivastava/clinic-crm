# 🔧 FIX: Vitals Column Migration

## ❌ Current Problem
```
Error: "Could not find the 'vitals' column of 'prescriptions' in the schema cache"
```

**Cause:** The database schema is missing the `vitals` column in the `prescriptions` table.

---

## ✅ Solution: Apply Migration (2 Steps)

### Step 1: Go to Supabase Dashboard

1. Open [Supabase Dashboard](https://supabase.com) 
2. Select your project: **clinic-crm**
3. Click **SQL Editor** (left sidebar)
4. Click **New Query** button

### Step 2: Run This SQL

Copy and paste this SQL query:

```sql
-- Add vitals column to prescriptions table for storing vital signs
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT NULL;

-- Create GIN index for efficient queries on vital signs data
CREATE INDEX IF NOT EXISTS idx_prescriptions_vitals 
ON prescriptions USING GIN (vitals);

-- Verify the column was added successfully
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prescriptions' 
ORDER BY ordinal_position;
```

Then click **Run** button (or press Ctrl+Enter).

**Expected output:**
```
✅ Query executed successfully

column_name  | data_type
-- column list showing vitals as jsonb
```

---

## 🧪 Verify the Fix

### Quick Test:
1. Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Log in to the app (if needed)
3. Go to an ongoing appointment as a doctor
4. Click **📊 Enter Vitals** button
5. Fill in vital signs:
   - BP: 120/80
   - HR: 72
   - Temp: 98.6°F
   - O2: 98%
   - Weight: 70kg
   - Height: 175cm
6. Click **✓ Save Vitals**

**Success:** You should see ✅ **Vitals saved successfully!**

---

## 🚀 Alternative: Auto-Migration via API

If you prefer to run the migration programmatically:

```bash
# Terminal command
curl -X POST http://localhost:3000/api/admin/migrations \
  -H "Authorization: Bearer migration-secret-key" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Migrations applied: Added appointment_type column and vitals column to prescriptions",
  "timestamp": "2026-05-02T..."
}
```

---

## 📊 What This Migration Creates

The `vitals` column stores patient vital signs as JSON:

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

**Stored in:** `prescriptions` table → `vitals` column (JSONB format)
**Index:** GIN index for fast queries on vital values

---

## ❓ Troubleshooting

### Error: "Column already exists"
✅ **No problem!** The `IF NOT EXISTS` clause handles this automatically.

### Still seeing "vitals column not found"?
1. Clear browser cache (Ctrl+Shift+Delete → Clear all)
2. Restart dev server: `npm run dev`
3. Refresh page (Ctrl+Shift+R)
4. Try again

### "exec_sql function not found" in Supabase?
1. This is normal - just use the SQL Editor approach (Step 2 above)
2. The GIN index might need to be created separately if you get an error
3. Run just the ALTER TABLE command first:
   ```sql
   ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT NULL;
   ```

### Table doesn't exist?
If prescriptions table doesn't exist, create it first:
```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  user_id UUID NOT NULL,
  appointment_id UUID,
  medications JSONB DEFAULT '[]',
  vitals JSONB DEFAULT NULL,
  issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✨ Features Now Available

After applying this migration:

✅ Doctors can enter vital signs during ongoing appointments
✅ Vitals are stored with prescriptions
✅ Vitals display in prescription view
✅ Support for multiple units (°C/°F, kg/lbs, cm/inches)
✅ Blood pressure with systolic/diastolic values
✅ Complete vital signs: BP, HR, Temp, O2, Weight, Height

---

## 📝 Files Created for This Fix

- `lib/db/migration_add_vitals_to_prescriptions.sql` - Migration SQL
- `VITALS_MIGRATION_FIX.md` - This guide
- `app/api/admin/migrations/route.ts` - Updated migration API
- `app/api/health/schema/route.ts` - Schema health check endpoint
- `app/appointments/page.tsx` - Updated with vitals entry feature

---

## 📞 Need Help?

If you're still having issues after applying the migration:

1. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs → Database
   - Look for any ALTER TABLE errors

2. **Verify Column Creation:**
   ```sql
   SELECT * FROM information_schema.columns 
   WHERE table_name = 'prescriptions' AND column_name = 'vitals';
   ```
   Should return exactly 1 row showing `vitals | jsonb`

3. **Check App Logs:**
   - Look in browser console (F12) for error messages
   - Check server logs in terminal running `npm run dev`

---

**That's it! You're now ready to save vital signs during appointments. 🎉**
