# Doctor Dropdown Debugging Guide

## Problem
The doctor dropdown on `/patients` and `/appointments` pages shows 3 hardcoded doctors instead of filtering by organization.

## Root Cause Analysis
The issue is likely one of:
1. **JWT token doesn't contain `organizationId`**
2. **Frontend not sending organizationId to API**
3. **API falling back to staff table when organizationId is missing**

## How to Debug

### Step 1: Check Browser Console for Logs
1. Open the browser to http://localhost:3000/patients or /appointments
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for these log messages:

**Expected logs when working correctly:**
```
✓ Using organizationId: 7b8d4741-9383-4604-ab63-4988abfe5f22
Fetching staff from URL: /api/staff?role=doctor&organizationId=7b8d4741-9383-4604-ab63-4988abfe5f22
📋 JWT Payload: { userId: "...", organizationId: "7b8d4741-9383-4604-ab63-4988abfe5f22", ... }
Staff API response: (2) [{…}, {…}]  // Should show filtered doctors
Number of doctors returned: 2
```

**Warning logs if something is wrong:**
```
⚠️ organizationId NOT found in JWT  // JWT doesn't have organizationId
⚠️ organizationId NOT set in userContext  // Context not loaded
⚠️ No organizationId provided - falling back to staff table  // API log showing fallback
```

### Step 2: Check Server Logs
The terminal running `npm run dev` will show server-side logs:

**Good logs:**
```
📥 Staff API Request: { organizationId: "7b8d4741-9383-4604-ab63-4988abfe5f22", role: "doctor", ... }
🔍 Querying users table with organizationId: 7b8d4741-9383-4604-ab63-4988abfe5f22
✅ Transformed staff: 2 doctors
  - Aaditri Srivastava (doctor)
  - Test Doctor (doctor)
```

**Problem logs:**
```
⚠️ No organizationId provided - falling back to staff table  // organizationId not sent
❌ Database error: ...  // Query failed
```

### Step 3: Manual API Test
Test the API directly in PowerShell:

```powershell
$token = "YOUR_AUTH_TOKEN"  # Get from browser console: localStorage.getItem('authToken')
$orgId = "7b8d4741-9383-4604-ab63-4988abfe5f22"

# Test WITHOUT organizationId (will show 3 hardcoded doctors)
Invoke-WebRequest -Uri "http://localhost:3000/api/staff?role=doctor" `
  -Headers @{Authorization="Bearer $token"}

# Test WITH organizationId (should show Aaditri Srivastava)
Invoke-WebRequest -Uri "http://localhost:3000/api/staff?role=doctor&organizationId=$orgId" `
  -Headers @{Authorization="Bearer $token"}
```

## Common Issues & Solutions

### Issue 1: JWT doesn't contain organizationId
**Symptom:** Console shows `⚠️ organizationId NOT found in JWT`

**Solution:** Check your login endpoint is setting organizationId in the token
- File: `app/api/auth/route.ts`
- Verify JWT payload includes `organizationId`

### Issue 2: organizationId is in JWT but not being sent to API
**Symptom:** Console shows organizationId extracted, but API logs show "No organizationId provided"

**Causes:**
- Token parsing failing (check `try/catch` block)
- Base64 decoding error
- URL not being built correctly

**Debug:**
```javascript
// Paste in browser console:
const token = localStorage.getItem('authToken');
const parts = token.split('.');
console.log('Token parts:', parts.length);
try {
  const payload = JSON.parse(atob(parts[1]));
  console.log('Decoded payload:', payload);
  console.log('Has organizationId:', !!payload.organizationId);
} catch(e) {
  console.error('Failed to decode:', e);
}
```

### Issue 3: API returns empty array when organizationId is provided
**Symptom:** organizationId sent correctly, but API returns `[]`

**Possible causes:**
- No users exist with that organizationId in database
- Users don't have role_id assigned
- Role doesn't have role_type='doctor'

**Solution:**
1. Check Supabase dashboard for users table
2. Verify users have organizationId and role_id values
3. Verify roles table has role_type='doctor'

## Quick Fixes

### If frontend logging shows organizationId correctly but API doesn't receive it:
1. Clear browser cache: Ctrl+Shift+Delete
2. Refresh page: Ctrl+R (or Cmd+R on Mac)
3. Check if URL encoding is correct

### If API shows correct query but returns nothing:
```sql
-- Run this in Supabase SQL Editor to verify data:
SELECT id, first_name, last_name, role_id, organization_id 
FROM users 
WHERE organization_id = '7b8d4741-9383-4604-ab63-4988abfe5f22'
ORDER BY first_name;
```

## Expected Behavior After Fix

1. **Console shows:** `Number of doctors returned: 2` (or more for your clinic)
2. **Doctor names:** Shows "Aaditri Srivastava" + other clinic doctors
3. **Not showing:** The 3 default doctors (John Smith, Sarah Johnson, Michael Brown)
4. **Dropdown:** Displays doctors specific to your organization/branch

## Need More Help?

If still not working:
1. Share the console logs (F12 > Console tab)
2. Share the server terminal logs
3. Verify organizationId exists in JWT token
4. Check if users table has data for that organization
