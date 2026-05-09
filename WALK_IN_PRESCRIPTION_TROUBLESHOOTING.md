# Walk-in Prescription Generation - Troubleshooting Guide

## ❌ Issue: Prescription not being created for completed walk-in

### 🔍 Quick Diagnosis

Follow these steps to identify the issue:

#### Step 1: Check Browser Console
1. Open your browser DevTools (F12)
2. Go to **Console** tab
3. Complete a walk-in with medicines
4. Look for these log messages:
   - `📝 Generating prescription for walk-in completion` - prescription generation started
   - `📋 Transformed medications` - medicines were transformed
   - `✅ Prescription created successfully` - prescription was created
   - `❌ Error creating prescription` - there was an error

**If you see error logs**, copy them and check the relevant section below.

#### Step 2: Check Supabase Database
1. Go to Supabase Dashboard
2. Open **SQL Editor**
3. Run this query:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prescriptions' 
ORDER BY ordinal_position;
```
4. Look for `walk_in_id` column (should be of type `uuid`)

**If you don't see `walk_in_id` column**, go to **Issue #1** below.

#### Step 3: Check Supabase Logs
1. Go to Supabase Dashboard → Logs
2. Filter by time (last 5 minutes)
3. Look for errors from `/api/walk-ins` endpoint
4. Search for error messages about prescriptions or `walk_in_id`

---

## 🔧 Common Issues and Fixes

### Issue #1: `walk_in_id` Column Doesn't Exist

**Symptom:** 
- Browser console shows error about `walk_in_id` column
- or Supabase query shows column is missing

**Fix:**
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the entire content from: `lib/db/migration_add_walk_in_id_to_prescriptions.sql`
4. Paste into SQL Editor
5. Click **Execute**
6. Verify success: Run the query from Step 2 above

**Verify:**
```sql
-- Should return the walk_in_id row:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'prescriptions' AND column_name = 'walk_in_id';
```

---

### Issue #2: No Medicines Being Added to Walk-in

**Symptom:**
- Walk-in can be completed but no medicines are saved
- "💊 Prescription" button doesn't appear on completed walk-in

**Fix:**
1. When completing a walk-in, ensure medicines are added:
   - Click **"💊 Medicines"** section
   - Enter medicine name, dosage, frequency
   - Click **Add** button
   - Repeat for each medicine
2. Verify medicines appear in the list
3. Then click **"✓ Complete"** button

**Debug:**
Look in browser console for when medicines change:
- Should see medicines being added to walk-in

---

### Issue #3: No Doctor Assigned to Walk-in

**Symptom:**
- Console shows: `⚠️ No doctor assigned to walk-in, prescription generation skipped`
- Prescription is not created

**Fix:**
1. When creating walk-in, select a doctor in **"Doctor Selection"** dropdown
   - If only one doctor exists, they're auto-selected
2. If no doctors exist, create a doctor user first:
   - Go to **Admin Panel → Staff**
   - Add a new doctor with role "doctor"

**Alternative:**
- If user completing walk-in is a doctor, they'll be used as prescription author
- But preferred: assign doctor when creating walk-in

---

### Issue #4: Medicines Not Being Sent in Request

**Symptom:**
- Console shows: `📝 Generating prescription for walk-in completion`
- But no medicines are in the transformed data
- Prescription created but with empty medications

**Fix:**
1. Check browser Network tab (DevTools → Network):
   - When clicking "✓ Complete", find the PATCH request to `/api/walk-ins`
   - Click on request
   - Go to **Request Body**
   - Verify `medicines` array is present and not empty
2. If medicines are missing:
   - Make sure medicines are added to walk-in BEFORE completing
   - Check if front-end is properly capturing medicines

**Debug Network Request:**
```javascript
// In browser console:
// Check if medicines are properly stored
localStorage.getItem('walkInData')
```

---

### Issue #5: Database Error (RLS or Constraints)

**Symptom:**
- Console shows: `❌ Error creating prescription: [error message]`
- Error mentions "new row violates row level security" or similar

**Fix:**
1. Check Supabase RLS policies on `prescriptions` table:
   - Go to Supabase Dashboard → Tables → prescriptions
   - Click **RLS** tab
   - Verify policies allow INSERT for your user/role
2. Check data types match:
   - `patient_id` - UUID
   - `user_id` - UUID
   - `walk_in_id` - UUID
   - `medications` - JSONB array
   - `organization_id` - UUID

**Verify RLS:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'prescriptions';
```

---

### Issue #6: Organization/Branch Mismatch

**Symptom:**
- Walk-in completes but prescription isn't visible
- No error in console

**Fix:**
1. Verify `organization_id` is set correctly:
   - Check localStorage: `localStorage.getItem('organizationId')`
2. Verify prescription is in same organization:
   - Supabase dashboard → prescriptions table → check organization_id matches
3. If branch_id is set, verify it matches

---

## ✅ Verification Steps

Once you think it's fixed, follow these steps:

1. **Create Test Walk-in:**
   - Go to Walk-ins page
   - Click "New Walk-in"
   - Enter: Name, Phone, Address
   - Select a Doctor
   - Click Create

2. **Start Walk-in:**
   - Click "Start" button
   - Status should change to "In Progress"

3. **Add Medicines:**
   - Click "💊 Medicines"
   - Enter at least one medicine:
     - Name: "Aspirin"
     - Dosage: "500mg"
     - Frequency: "3x daily"
   - Click "Add"

4. **Complete Walk-in:**
   - Click "✓ Complete" button
   - Should see success message

5. **Verify Prescription Created:**
   - A "💊 Prescription" button should appear on the completed walk-in
   - Click it → should see prescription in Prescriptions page
   - Go to Supabase → prescriptions table → new record should exist

---

## 📊 Manual Testing

If UI doesn't work, test the API directly:

**1. Complete a walk-in via API:**
```bash
curl -X PATCH http://localhost:3000/api/walk-ins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "id": "walk-in-uuid",
    "status": "completed",
    "medicines": [
      {
        "name": "Aspirin",
        "dosage": "500mg",
        "frequency": "3x daily",
        "id": "1"
      }
    ]
  }'
```

2. Check response for `prescription` field
3. If successful, check Supabase for new prescription record

---

## 📞 Still Having Issues?

If you've checked all above:

1. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs
   - Filter for `/api/walk-ins` endpoint
   - Look for detailed error messages

2. **Run Debug Script:**
   ```bash
   node debug-walk-in-prescription.js
   ```

3. **Check Required Columns:**
   ```sql
   -- In Supabase SQL Editor, verify all columns exist:
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name IN ('walk_ins', 'prescriptions')
   ORDER BY table_name, ordinal_position;
   ```

4. **Collect Information:**
   - Screenshot of console errors
   - Network request/response (from DevTools Network tab)
   - Supabase logs
   - Walk-in ID that failed to generate prescription

---

## 🚀 Quick Fix Checklist

- [ ] Migration file exists: `lib/db/migration_add_walk_in_id_to_prescriptions.sql`
- [ ] Migration has been run in Supabase (walk_in_id column exists)
- [ ] Walk-in has at least one medicine added
- [ ] Walk-in has a doctor assigned
- [ ] User has permission to create prescriptions
- [ ] Browser console shows no errors
- [ ] Supabase logs show no errors
- [ ] Prescription record appears in Supabase database

---

**Next Step:** Run the debug script and check the sections above based on what you find!
