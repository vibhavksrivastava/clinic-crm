# Walk-in Prescription Generation Implementation

## Overview
This implementation enables automatic prescription generation when a doctor completes a walk-in appointment with all details (medicines, vitals, etc.). Prescriptions generated from walk-ins can be viewed from multiple places:
- Walk-ins page (view prescriptions button)
- Prescriptions page (with walk-in indicator)
- Patient page (prescriptions section)

## 🔧 Changes Made

### 1. Database Migration
**File:** `lib/db/migration_add_walk_in_id_to_prescriptions.sql`

Added new column to link prescriptions to walk-ins:
- `walk_in_id` (UUID, FK to walk_ins table)
- Created indexes for optimal performance:
  - `idx_prescriptions_walk_in_id`
  - `idx_prescriptions_walk_in_org`
  - `idx_prescriptions_walk_in_branch`

**SQL to run:**
```sql
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS walk_in_id UUID REFERENCES walk_ins(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prescriptions_walk_in_id 
ON prescriptions(walk_in_id);
```

### 2. API Endpoints

#### Walk-in API (`app/api/walk-ins/route.ts`)
**Updated PATCH endpoint:**
- Added support for `generatePrescription` parameter
- When walk-in status changes to `completed` with medicines:
  - Automatically creates a prescription record
  - Links prescription to walk-in via `walk_in_id`
  - Returns prescription data in response

**Request body example:**
```json
{
  "id": "walk-in-uuid",
  "status": "completed",
  "medicines": [
    {
      "id": "1",
      "name": "Aspirin",
      "dosage": "500mg",
      "frequency": "3x daily"
    }
  ],
  "generatePrescription": true
}
```

**Response includes:**
```json
{
  "success": true,
  "data": { /* updated walk-in */ },
  "prescription": { /* created prescription */ },
  "message": "Walk-in updated and prescription generated successfully"
}
```

#### Prescriptions API (`app/api/prescriptions/route.ts`)
**Updated GET endpoint:**
- Added `walk_in_id` query parameter support
- Example: `/api/prescriptions?walk_in_id=uuid`
- Returns all prescriptions linked to a specific walk-in

**Updated POST endpoint:**
- Added `walk_in_id` field to request body
- Validates doctor authorization for walk-in
- Creates prescription with walk-in relationship

### 3. Frontend Components

#### Walk-In Card (`components/walk-ins/WalkInCard.tsx`)
- Added `Link` import for navigation
- Added "💊 Prescription" button when walk-in is completed with medicines
- Button navigates to prescriptions page with walk-in filter

**Button appears when:**
- Walk-in status is "completed" 
- Walk-in has medicines recorded

#### Walk-In List (`components/walk-ins/WalkInList.tsx`)
**Updated `handleStatusChange` function:**
- Automatically includes medicines in PATCH request when completing
- Sends `generatePrescription: true` flag
- Shows success alert with prescription generation confirmation
- Fetches updated walk-in list after completion

#### Prescriptions Page (`components/PrescriptionsContent.tsx`)
**Updated Prescription interface:**
- Added `appointment_id` and `walk_in_id` fields

**Visual indicators in prescription list:**
- Shows "🚶 Walk-in Prescription" for prescriptions from walk-ins
- Shows "📅 Appointment Prescription" for prescriptions from appointments

**Updated prescription details display:**
- Added walk-in information section
- Shows walk-in ID when prescription is linked to walk-in
- Distinguishes between appointment and walk-in prescriptions

**Updated `fetchData` function:**
- Now supports filtering by `walk_in_id` query parameter
- Automatically selects first prescription when filtering by walk-in
- Example: `/prescriptions?walk_in=walk-in-uuid`

### 4. Data Flow

```
Walk-in Completion
    ↓
Doctor adds medicines → Status changed to "completed"
    ↓
handleStatusChange sends PATCH request with:
  - status: "completed"
  - medicines: [...]
  - generatePrescription: true
    ↓
API creates prescription with:
  - patient_id (from walk-in)
  - user_id (doctor)
  - walk_in_id (links to walk-in)
  - medications: (from medicines array)
    ↓
Prescription visible in:
  1. Walk-in card (view button)
  2. Prescriptions page (with walk-in indicator)
  3. Patient page (in prescriptions section)
```

## 🚀 Features

### Automatic Prescription Generation
- When doctor completes walk-in with medicines
- All medicine details are transferred to prescription
- No manual prescription creation needed

### Prescription Tracking
- Prescriptions linked to walk-ins are clearly identified
- Can filter prescriptions by walk-in ID
- Shows prescription source (walk-in vs appointment)

### Navigation
- From walk-in: Click "💊 Prescription" button
- From prescriptions page: See walk-in indicator
- From patient page: All prescriptions (appointment + walk-in)

### Multi-tenant Support
- All data includes organization_id and branch_id
- Prescriptions properly scoped to organization/branch
- Walk-in to prescription relationship maintains scope

## 🔐 Authorization

- **Doctors**: Can create prescriptions for their own walk-ins
- **Doctors**: Can view prescriptions for their patients
- **Receptionists/Admins**: Can view all prescriptions
- Walk-in ownership verified before prescription creation

## 📝 Testing Checklist

- [ ] Apply database migration: `lib/db/migration_add_walk_in_id_to_prescriptions.sql`
- [ ] Create a new walk-in
- [ ] Start the walk-in
- [ ] Add medicines to the walk-in
- [ ] Complete the walk-in
- [ ] Verify prescription appears in prescriptions page
- [ ] Click "Prescription" button from walk-in card
- [ ] Verify prescription shows walk-in indicator
- [ ] View patient page to see prescription in patient history
- [ ] Verify prescription can be downloaded/printed

## 🔄 Compatibility

- ✅ Works with existing appointment prescriptions
- ✅ Doesn't affect appointment prescription generation
- ✅ Maintains all existing prescription features
- ✅ Backward compatible with existing data

## 📊 Query Examples

**Get prescriptions for a specific walk-in:**
```javascript
fetch('/api/prescriptions?walk_in_id=abc123')
```

**Get prescriptions for a patient (including both appointment and walk-in):**
```javascript
fetch('/api/prescriptions?patient_id=xyz789')
```

**Create prescription from walk-in (called automatically):**
```javascript
fetch('/api/prescriptions', {
  method: 'POST',
  body: JSON.stringify({
    patient_id: 'xyz789',
    medications: [...],
    walk_in_id: 'abc123'
  })
})
```

## 🎯 Summary

The implementation provides a seamless workflow for doctors to automatically generate prescriptions when completing walk-in appointments. Prescriptions are properly linked to walk-ins, clearly identified in the UI, and accessible from multiple locations in the application. The feature maintains all existing functionality while adding a convenient automatic prescription generation capability.
