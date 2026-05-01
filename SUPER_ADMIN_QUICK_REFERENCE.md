# 🔐 Super Admin Panel - Quick Reference

## 📍 Routes

| Route | Purpose | Features |
|-------|---------|----------|
| `/admin` | Dashboard | Stats, quick actions, org list |
| `/admin/organizations` | Clinic Management | CRUD organizations |
| `/admin/organizations/[id]` | Org Details | View org, branches, staff |
| `/admin/branches` | Branch Management | CRUD branches |
| `/admin/staff` | Staff Management | CRUD staff members |
| `/admin/settings` | System Settings | Configure security, features |

## 🔌 API Endpoints

### Dashboard
```
GET /api/admin/dashboard
Response: { stats, organizations }
```

### Organizations
```
GET /api/admin/organizations          # List all
POST /api/admin/organizations         # Create
GET /api/admin/organizations/[id]     # Get one
PUT /api/admin/organizations/[id]     # Update
DELETE /api/admin/organizations/[id]  # Delete
```

### Branches
```
GET /api/admin/branches               # List all
POST /api/admin/branches              # Create
GET /api/admin/branches/[id]          # Get one
DELETE /api/admin/branches/[id]       # Delete
```

### Staff
```
GET /api/admin/staff                  # List all
POST /api/admin/staff                 # Create (password hashed)
GET /api/admin/staff/[id]             # Get one
DELETE /api/admin/staff/[id]          # Delete
```

### Roles & Settings
```
GET /api/admin/roles                  # Get system roles
GET /api/admin/settings               # Get settings
POST /api/admin/settings              # Save settings
```

## 🎨 UI Components

### Dashboard
- **StatCard**: Shows metric with icon and value
- **Quick Actions**: Navigation buttons to management pages
- **Organizations Table**: Recent orgs with counts and quick links

### Forms
- **Organization Form**: 7 fields (name, email, phone, address, city, country, plan)
- **Branch Form**: 7 fields (clinic, name, address, city, country, phone, email)
- **Staff Form**: 9 fields (clinic, branch, role, name, email, phone, passwords)

### Tables
- **Organizations Table**: Name, email, plan, branches, staff, actions
- **Branches Table**: Name, clinic, location, staff, created, actions
- **Staff Table**: Name, email, role, clinic, status, actions

## 🔐 Authentication

All routes require JWT token:
```bash
# In Authorization header
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/organizations

# Or in x-token header (set by middleware)
curl -H "x-token: <token>" http://localhost:3000/api/admin/organizations
```

## 📦 Data Models

### Organization
```typescript
{
  id: UUID
  name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  subscription_plan: 'free' | 'basic' | 'professional' | 'enterprise'
  created_at: timestamp
  branches_count: number (computed)
  users_count: number (computed)
}
```

### Branch
```typescript
{
  id: UUID
  organization_id: UUID
  name: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  created_at: timestamp
  users_count: number (computed)
}
```

### Staff (User)
```typescript
{
  id: UUID
  first_name: string
  last_name: string
  email: string
  phone: string
  organization_id: UUID
  branch_id: UUID (optional)
  role_id: UUID
  password_hash: string (hashed)
  user_status: 'active' | 'inactive'
  created_at: timestamp
  role: { id, name, role_type }
}
```

## 🎯 System Roles

7 built-in system roles:
1. **Super Admin** - Full system access
2. **Clinic Admin** - Manage clinic + branches
3. **Doctor** - Clinical operations
4. **Nurse** - Clinical support
5. **Receptionist** - Scheduling + billing
6. **Pharmacist** - Pharmacy operations
7. **Manager** - General management

Each role has specific permissions in the `roles` table.

## ✅ Features

### Clinic Management
- ✅ Create clinics with details
- ✅ View clinic profile
- ✅ Delete clinics (cascades)
- ✅ Subscription plan tracking
- ✅ View branches and staff per clinic

### Branch Management
- ✅ Create branches per clinic
- ✅ Location tracking
- ✅ Staff per branch
- ✅ Contact information

### Staff Management
- ✅ Add staff with role assignment
- ✅ Automatic password hashing
- ✅ Clinic and branch assignment
- ✅ Status tracking (active/inactive)
- ✅ View staff details
- ✅ Delete staff members

### System Settings
- ✅ Configure security (login attempts, lockout, timeout)
- ✅ Toggle features (WhatsApp, pharmacy, billing)
- ✅ Support contact information

## 🚀 Getting Started

### 1. Register as Super Admin
```bash
curl -X PUT http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "My Clinic",
    "email": "admin@clinic.com",
    "firstName": "Admin",
    "lastName": "User",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinic.com",
    "password": "SecurePassword123!"
  }'
# Returns: { token, user, organization }
```

### 3. Access Admin Panel
Navigate to: `http://localhost:3000/admin`

### 4. Create Organization
```bash
curl -X POST http://localhost:3000/api/admin/organizations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "City Medical Center",
    "email": "info@citymedical.com",
    "phone": "+1-555-0123",
    "address": "456 Health Ave",
    "city": "NYC",
    "country": "USA",
    "subscription_plan": "professional"
  }'
```

## 📊 Dashboard Statistics

Automatically calculates:
- Total Clinics (organizations count)
- Total Branches (all branches)
- Active Users (active staff)
- Total Patients (across all clinics)
- Today's Appointments
- System Users (staff count)

## 🎨 Design

- **Framework**: Tailwind CSS
- **Colors**: Blue (primary), Gray (secondary), Green/Red (status)
- **Layout**: Responsive grid (1, 2, 3 columns)
- **Forms**: Clean input styling with labels
- **Tables**: Hover effects, sortable
- **Alerts**: Success (green), Error (red), Info (blue)

## 🔄 Data Cascade

When deleting:
- **Organization**: Deletes all branches and their users
- **Branch**: Deletes all staff assigned to it
- **Staff**: No cascade, just removes user

## 📈 Performance

- All API responses include counts and computed fields
- Tables paginate/load incrementally
- Forms validate before submission
- Error handling with user-friendly messages

## 🎯 Next Phase: Clinic Admin

After Super Admin, build Clinic Admin panel:
- Clinic-level dashboard
- Branch management within clinic
- Staff management for clinic
- Patient management
- Appointment management
- Billing and invoicing
