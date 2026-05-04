# Walk-in Management System - Setup Guide

## Overview

This guide walks you through setting up and deploying the new Walk-in Management System for the clinic. This feature allows receptionists and doctors to quickly create and track walk-in patients, record additional tests, and monitor clinic traffic with comprehensive reporting.

## Features

✅ **Quick Walk-in Creation** - Create walk-ins with just name, phone, and address  
✅ **Status Tracking** - Track walk-in progress (Pending → In Progress → Completed)  
✅ **Additional Tests** - Mark recommended tests for each patient  
✅ **Time Tracking** - Automatically track check-in and check-out times  
✅ **Daily Reports** - View walk-in statistics and trends  
✅ **Weekly/Monthly/Yearly Analytics** - Comprehensive reporting  
✅ **Mobile-Friendly UI** - Responsive design for all devices  
✅ **Role-Based Access** - Receptionists and doctors can manage walk-ins  

---

## 📋 Database Setup

### Step 1: Run the Migration

Execute the walk-ins table migration in your Supabase PostgreSQL database:

```sql
-- Run this SQL in Supabase SQL Editor
-- File: lib/db/migration_add_walk_ins_table.sql

-- Create walk_ins table with all required fields and indexes
-- This creates:
-- - walk_ins table with UUID primary key
-- - Foreign key relationships to patients, users, organizations, branches
-- - Indexes for optimal query performance
-- - Row-level security policies
```

**Steps to apply migration:**

1. Open Supabase Dashboard → Go to your project
2. Navigate to SQL Editor
3. Open `lib/db/migration_add_walk_ins_table.sql`
4. Copy and paste the entire SQL content
5. Click "Execute"
6. Verify success - you should see no errors

**Verify the migration:**

```sql
-- Run this to verify the walk_ins table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'walk_ins';

-- Check the columns
\d walk_ins
```

---

## 🔧 API Endpoints

The following REST API endpoints are now available:

### Get Walk-ins
```
GET /api/walk-ins
Query Parameters:
  - id: Get specific walk-in by ID
  - status: Filter by status (pending, in-progress, completed, cancelled)
  - date: Filter by date (YYYY-MM-DD)
  - phone: Search by phone number
  - limit: Results per page (default: 50)
  - offset: Pagination offset (default: 0)

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phoneNumber": "1234567890",
      "address": "123 Main St",
      "status": "pending",
      "checkInTime": "2024-05-04T10:30:00Z",
      "checkOutTime": null,
      "additionalTests": [],
      "notes": "Optional notes",
      "createdAt": "2024-05-04T10:30:00Z",
      ...
    }
  ],
  "count": 25,
  "limit": 50,
  "offset": 0
}
```

### Create Walk-in
```
POST /api/walk-ins
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "phoneNumber": "1234567890",
  "address": "123 Main St",
  "patientId": "uuid" (optional),
  "notes": "Any remarks" (optional)
}

Response:
{
  "success": true,
  "data": { ... walk-in object ... },
  "message": "Walk-in created successfully"
}
```

### Update Walk-in
```
PATCH /api/walk-ins
Content-Type: application/json

Request Body:
{
  "id": "uuid",
  "status": "in-progress" or "completed",
  "additionalTests": [
    { "id": "1", "name": "Blood Test" },
    { "id": "2", "name": "X-Ray" }
  ],
  "notes": "Updated notes" (optional)
}

Response:
{
  "success": true,
  "data": { ... updated walk-in ... },
  "message": "Walk-in updated successfully"
}
```

### Delete Walk-in (Admin Only)
```
DELETE /api/walk-ins?id=uuid

Response:
{
  "success": true,
  "message": "Walk-in deleted successfully"
}
```

### Get Reports
```
GET /api/walk-ins/reports
Query Parameters:
  - type: "stats" | "daily" | "weekly" | "monthly" | "yearly"
  - startDate: Optional start date
  - endDate: Optional end date

Response (for type=stats):
{
  "success": true,
  "data": {
    "today": 5,
    "thisWeek": 32,
    "thisMonth": 120,
    "thisYear": 1240,
    "todayCompleted": 4,
    "averageTimeToComplete": 25,
    "completionRate": 80
  }
}

Response (for type=daily):
{
  "success": true,
  "data": {
    "period": "daily",
    "date": "2024-05-04",
    "totalWalkIns": 10,
    "completedWalkIns": 8,
    "averageTimeMinutes": 24,
    "maxTimeMinutes": 45,
    "minTimeMinutes": 10,
    "commonTests": [
      { "testName": "Blood Test", "count": 6 },
      { "testName": "X-Ray", "count": 3 }
    ],
    "walkIns": [ ... ]
  }
}
```

---

## 🎨 Component Structure

### Components Created

1. **WalkInForm** (`components/walk-ins/WalkInForm.tsx`)
   - Mobile-friendly form to create new walk-ins
   - Validates required fields (name, phone, address)
   - Shows success/error messages

2. **WalkInCard** (`components/walk-ins/WalkInCard.tsx`)
   - Displays individual walk-in details
   - Shows check-in/check-out times and duration
   - Allows adding/removing additional tests
   - Status management buttons

3. **WalkInList** (`components/walk-ins/WalkInList.tsx`)
   - Lists all walk-ins with filtering
   - Filter by status and phone number
   - Pagination support
   - Real-time updates

4. **WalkInStatsCard** (`components/walk-ins/WalkInStatsCard.tsx`)
   - Displays quick statistics
   - Shows today's count, weekly total, monthly total, yearly total
   - Displays average completion time
   - Completion rate percentage

5. **WalkInReports** (`components/walk-ins/WalkInReports.tsx`)
   - Comprehensive reporting dashboard
   - Daily, weekly, monthly, yearly reports
   - Common tests analysis
   - Breakdown charts and statistics

### Main Page

**Page:** `/app/walk-ins/page.tsx`

- Combined interface with:
  - Quick stats overview
  - Walk-in creation form (left column, sticky on desktop)
  - Walk-in list with tracking (right column)
  - Reports dashboard (tabbed interface)

---

## 🚀 Deployment Steps

### Step 1: Apply Database Migration

1. Connect to your Supabase database
2. Run the migration SQL script
3. Verify all tables and indexes are created

### Step 2: Deploy Code

```bash
# Build the application
npm run build

# Start the development server (for testing)
npm run dev

# Or deploy to production
npm start
```

### Step 3: Test the System

1. Open http://localhost:3000/walk-ins (or your deployed URL)
2. Create a test walk-in with:
   - Name: "Test Patient"
   - Phone: "1234567890"
   - Address: "Test Address"
3. Verify the walk-in appears in the list
4. Update status to "In Progress"
5. Add a test (e.g., "Blood Test")
6. Complete the walk-in
7. Check Reports tab for statistics

---

## 👤 User Roles & Permissions

### Who Can Access?

**Can Create & Update Walk-ins:**
- Receptionist
- Doctor
- Clinic Admin
- Branch Admin
- Super Admin

**Can Delete Walk-ins:**
- Clinic Admin
- Branch Admin
- Super Admin

**Can View Walk-ins:**
- All staff members within their organization
- Branch-specific filtering applied automatically

### Permission Checks

The API automatically enforces:
- Organization ID filtering (users can only see their clinic's data)
- Branch filtering (if user has branch context)
- Role-based action restrictions (delete, update)

---

## 📱 Mobile Responsiveness

The walk-in management system is fully responsive:

- **Mobile (< 768px):** Single column layout, stacked form and list
- **Tablet (768px - 1024px):** Two column layout
- **Desktop (> 1024px):** Three column layout with sticky form

### Mobile Optimizations:
- Touch-friendly buttons (min 44px height)
- Simplified forms on smaller screens
- Swipe-friendly cards
- Mobile-optimized status badges
- Efficient data loading with pagination

---

## 🔍 Features Deep Dive

### Walk-in Creation
- Only requires: Name, Phone, Address (all required)
- Optional: Patient ID (links to existing patient), Notes
- Auto-generates check-in timestamp
- Validates phone format
- Creates organization-scoped records

### Status Management
- **Pending**: Initial state when created
- **In Progress**: Clicked "Start" button
- **Completed**: Clicked "Complete" button, auto-generates check-out time
- **Cancelled**: Soft delete (hidden from active lists)

### Additional Tests
- Add tests during walk-in or after creation
- Tests are stored as JSON array
- Can add/remove multiple tests
- Aggregated in reports for analysis

### Time Tracking
- Check-in time: Auto-generated on creation
- Check-out time: Auto-generated on completion
- Duration: Calculated automatically (in minutes)
- Used in reports for average calculation

### Reporting Features

**Daily Report:**
- Total walk-ins for selected date
- Completed count
- Average/max/min time to completion
- Most recommended tests
- List of all walk-ins for that day

**Weekly Report:**
- Total walk-ins for week
- Daily breakdown
- Completion statistics
- Average completion time

**Monthly Report:**
- Total walk-ins for month
- Weekly breakdown
- Average completion time
- Trends analysis

**Yearly Report:**
- Total walk-ins for year
- Monthly breakdown
- Quarterly statistics
- Year-over-year trends

---

## 🐛 Troubleshooting

### Issue: Walk-ins page shows "Unauthorized"
**Solution:** Ensure user is logged in and has appropriate role

### Issue: Can't create walk-in
**Solution:** 
- Check network connectivity
- Verify all required fields are filled
- Check user permissions (must be receptionist/doctor/admin)

### Issue: Reports show no data
**Solution:**
- Ensure walk-ins have been created
- Check date range in filters
- Verify organization_id is set correctly

### Issue: Tests don't save
**Solution:**
- Refresh the page after adding tests
- Check browser console for errors
- Verify API endpoint is accessible

---

## 📊 Database Queries

### Common Queries

```sql
-- Get today's walk-ins
SELECT * FROM walk_ins 
WHERE DATE(check_in_time) = CURRENT_DATE
AND organization_id = 'your-org-id'
ORDER BY check_in_time DESC;

-- Get average time to completion
SELECT AVG(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/60) as avg_minutes
FROM walk_ins 
WHERE status = 'completed'
AND DATE(check_in_time) = CURRENT_DATE
AND organization_id = 'your-org-id';

-- Get most common tests
SELECT jsonb_array_elements(additional_tests)->>'name' as test_name, 
       COUNT(*) as count
FROM walk_ins
WHERE DATE(check_in_time) >= CURRENT_DATE - INTERVAL '30 days'
AND organization_id = 'your-org-id'
GROUP BY test_name
ORDER BY count DESC;

-- Get walk-ins by status
SELECT status, COUNT(*) as count
FROM walk_ins
WHERE DATE(check_in_time) = CURRENT_DATE
AND organization_id = 'your-org-id'
GROUP BY status;
```

---

## 🔒 Security Considerations

1. **Row Level Security (RLS):** Enabled on walk_ins table
2. **Organization Isolation:** All queries filtered by organization_id
3. **Branch Isolation:** Branch-level filtering where applicable
4. **Role-Based Access:** API enforces role permissions
5. **Audit Trail:** Created_by and updated_by tracked for accountability
6. **Soft Deletes:** Walk-ins marked as 'cancelled' instead of hard deleted

---

## 📈 Performance Optimization

### Indexes Created:
- `idx_walk_ins_organization_id` - Fast organization filtering
- `idx_walk_ins_branch_id` - Fast branch filtering  
- `idx_walk_ins_patient_id` - Fast patient lookup
- `idx_walk_ins_status` - Fast status filtering
- `idx_walk_ins_check_in_time` - Fast date filtering
- `idx_walk_ins_created_by` - Fast staff filtering
- `idx_walk_ins_created_at` - Fast date-range queries
- `idx_walk_ins_org_date` - Optimized reporting queries

### Query Optimization:
- Pagination with limit/offset
- Selective field fetching
- Indexed filtering
- Connection pooling via Supabase

---

## 🎯 Next Steps

1. ✅ Apply database migration
2. ✅ Deploy code to production
3. ✅ Test all walk-in features
4. ✅ Train staff on usage
5. ✅ Monitor performance metrics
6. ✅ Set up automated backups
7. ✅ Configure alerts for high walk-in volumes

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review API documentation
3. Check Supabase logs and SQL Editor for database issues
4. Contact development team for code-related issues

---

## Version Info

- **Feature Version:** 1.0.0
- **Created:** May 2024
- **Last Updated:** May 2024
- **Status:** Production Ready
