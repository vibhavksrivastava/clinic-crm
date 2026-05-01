# Role Management System - API Testing Guide

## Overview
The clinic CRM now supports:
- **System Roles**: Predefined roles (Super Admin, Clinic Admin, Branch Admin, Doctor, Nurse, Receptionist, Pharmacist)
- **Custom Clinic Roles**: Super Admin can create custom roles for specific clinics
- **Role-Based Staff Assignment**: Clinic Admins can assign staff to available roles

## Architecture

```
┌─────────────────────────────────────────────┐
│        Role Management System               │
├─────────────────────────────────────────────┤
│ SYSTEM ROLES (predefined, cannot delete)   │
│ - Super Admin                               │
│ - Clinic Admin                              │
│ - Branch Admin                              │
│ - Doctor                                    │
│ - Nurse                                     │
│ - Receptionist                              │
│ - Pharmacist                                │
├─────────────────────────────────────────────┤
│ CUSTOM ROLES (per clinic)                  │
│ - Created by: Super Admin                   │
│ - Editable by: Super Admin                  │
│ - Can be deleted if no users assigned       │
└─────────────────────────────────────────────┘
```

## API Endpoints

### GET /api/admin/roles
Get all available roles (system + custom for organization)

**Request:**
```bash
curl -X GET http://localhost:3000/api/admin/roles \
  -H "Authorization: Bearer <token>"
```

**Query Parameters:**
- `org` (optional): Organization ID to filter roles for specific clinic

**Response:**
```json
{
  "roles": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "Super Admin",
      "role_type": "super_admin",
      "is_system_role": true,
      "organization_id": null,
      "permissions": ["manage_organizations", "manage_staff", ...]
    },
    {
      "id": "custom-role-uuid",
      "name": "Senior Doctor",
      "role_type": "custom",
      "is_system_role": false,
      "organization_id": "clinic-uuid",
      "description": "Senior medical practitioner",
      "permissions": ["view_patients", "create_prescriptions", ...]
    }
  ]
}
```

### POST /api/admin/roles
Create a new custom role (Super Admin only)

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Senior Doctor",
    "description": "Senior medical practitioner with advanced permissions",
    "organization_id": "clinic-uuid",
    "permissions": [
      "view_patients",
      "create_appointments",
      "create_prescriptions",
      "manage_own_appointments"
    ]
  }'
```

**Response:**
```json
{
  "role": {
    "id": "custom-role-uuid",
    "name": "Senior Doctor",
    "description": "Senior medical practitioner with advanced permissions",
    "role_type": "custom",
    "is_system_role": false,
    "organization_id": "clinic-uuid",
    "permissions": ["view_patients", "create_appointments", "create_prescriptions", "manage_own_appointments"],
    "created_at": "2026-04-20T10:00:00Z"
  }
}
```

### PUT /api/admin/roles
Update a custom role (Super Admin only, cannot modify system roles)

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "custom-role-uuid",
    "name": "Senior Doctor",
    "description": "Updated description",
    "permissions": ["view_patients", "create_prescriptions", "view_pharmacy"]
  }'
```

### DELETE /api/admin/roles
Delete a custom role (Super Admin only)

**Query Parameters:**
- `id` (required): Role ID to delete

**Request:**
```bash
curl -X DELETE "http://localhost:3000/api/admin/roles?id=custom-role-uuid" \
  -H "Authorization: Bearer <token>"
```

**Constraints:**
- ❌ Cannot delete system roles
- ❌ Cannot delete roles assigned to any users

## How It Works

### 1. Super Admin Creates a Custom Role
```
Super Admin logs in
→ Navigate to /admin/roles
→ Click "Create New Role"
→ Fill in role details:
   - Name: "Senior Doctor"
   - Organization: "Demo Clinic"
   - Permissions: Select relevant permissions
→ Click "Create Role"
```

### 2. Clinic Admin Sees Available Roles
```
Clinic Admin logs in
→ Navigate to /admin/staff
→ Click "Add Staff Member"
→ Select their clinic in "Clinic" dropdown
→ In "Role" dropdown, they see:
   - All system roles (Super Admin, Clinic Admin, Branch Admin, Doctor, etc.)
   - All custom roles created for their clinic
→ Select "Senior Doctor" (custom role)
→ Fill staff details and click "Create"
```

### 3. Multi-Tenant Data Isolation
- **Super Admin**: Sees all roles from all clinics
- **Clinic Admin**: Sees only system roles + custom roles for their clinic
- **Other Roles**: See only roles assigned to them

## Role-Based Permissions

Each role has a set of permissions. When a custom role is created, you can select:

### Management Permissions
- `manage_organizations` - Create/edit/delete clinics
- `manage_branches` - Create/edit/delete branches
- `manage_staff` - Add/remove staff members
- `manage_roles` - Create/edit/delete custom roles
- `manage_users` - Manage user accounts
- `manage_settings` - Modify system settings

### Clinical Permissions
- `view_patients` - Access patient records
- `manage_patients` - Create/edit patient data
- `create_appointments` - Schedule appointments
- `manage_appointments` - Edit/cancel appointments
- `create_prescriptions` - Write prescriptions
- `manage_prescriptions` - Edit/approve prescriptions

### Pharmacy Permissions
- `view_pharmacy` - View pharmacy data
- `manage_pharmacy` - Manage prescriptions
- `manage_pharmacy_stock` - Manage medicine inventory
- `dispense_prescriptions` - Dispense medications

### Other Permissions
- `manage_invoices` - Create and manage invoices
- `view_audit_logs` - Access audit logs
- `manage_whatsapp` - Configure WhatsApp integration
- `system_config` - Configure system settings
- `view_reports` - View analytics/reports
- `manage_subscriptions` - Manage clinic subscriptions

## Testing Checklist

### ✅ Test 1: Create Custom Role
```
1. Login as admin@clinic.com (super_admin)
2. Go to /admin/roles
3. Click "Create New Role"
4. Fill in:
   - Name: "Senior Doctor"
   - Organization: "Demo Clinic"
   - Description: "Senior medical practitioner"
   - Permissions: view_patients, create_appointments, create_prescriptions
5. Click "Create Role"
6. Expected: Role appears in list with "Custom" badge
```

### ✅ Test 2: Assign Staff to Custom Role
```
1. Still logged in as super_admin
2. Go to /admin/staff
3. Click "Add Staff Member"
4. Fill in:
   - Clinic: "Demo Clinic"
   - Role: "Senior Doctor" (select the custom role)
   - First Name: "Jane"
   - Last Name: "Smith"
   - Email: "jane@demo.com"
   - Password: "Test1234!"
5. Click "Create"
6. Expected: Staff member created and appears in list with "Senior Doctor" role
```

### ✅ Test 3: Clinic Admin Only Sees Their Roles
```
1. Create a second clinic (as super_admin)
2. Create a custom role for that clinic
3. Create a clinic_admin user for that new clinic
4. Login as the new clinic_admin
5. Go to /admin/staff
6. Try to create staff - check role dropdown
7. Expected: Only see system roles + roles for their clinic (NOT roles from other clinics)
```

### ✅ Test 4: Cannot Modify System Roles
```
1. Login as super_admin
2. Go to /admin/roles
3. Find "Doctor" (system role)
4. Try to click "Edit"
5. Expected: Alert "System roles cannot be edited"
```

### ✅ Test 5: Cannot Delete Role with Assigned Users
```
1. Login as super_admin
2. Create a custom role
3. Create a staff member with that role
4. Try to delete the role
5. Expected: Error "Cannot delete role that is assigned to 1 user(s)"
```

### ✅ Test 6: Delete Custom Role (when not assigned)
```
1. Create a custom role
2. DO NOT assign any users to it
3. Try to delete the role
4. Expected: Role successfully deleted
```

## Database Schema

### roles table
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  role_type VARCHAR(50) NOT NULL,  -- 'super_admin', 'clinic_admin', 'doctor', 'custom', etc.
  permissions JSONB DEFAULT '[]',
  is_system_role BOOLEAN DEFAULT FALSE,
  organization_id UUID REFERENCES organizations(id),  -- NULL for system roles
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(organization_id, name)
);
```

### users table (updated)
```sql
ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);
```

## Security Notes

1. **System roles are immutable**: Cannot be modified or deleted
2. **Organization isolation**: Clinic admins can only see roles for their organization
3. **Access control**: Only super_admin can create/edit/delete custom roles
4. **Referential integrity**: Cannot delete roles with assigned users
5. **Audit trail**: All role changes logged in audit_logs table

## Example Workflows

### Workflow 1: Setting Up a New Clinic with Custom Roles
```
1. Super Admin creates new organization (clinic)
2. Super Admin creates custom roles:
   - "Senior Doctor" (manage appointments, view patients)
   - "Junior Doctor" (view patients only)
   - "Medical Secretary" (manage appointments, manage invoices)
3. Super Admin creates clinic_admin user for the clinic
4. Clinic admin logs in and assigns staff to custom roles
```

### Workflow 2: Adjusting Permissions for Existing Role
```
1. Clinic reports that "Senior Doctor" needs access to pharmacy
2. Super Admin goes to /admin/roles
3. Find and edit "Senior Doctor" role
4. Add permission: "manage_pharmacy"
5. All doctors with this role immediately get access
```

## FAQ

### Q: Can clinic admin create custom roles?
**A:** No, only super_admin can create custom roles. Clinic admins can only view and assign staff to existing roles.

### Q: Can I have the same role name in different clinics?
**A:** Yes! Each clinic can have its own "Senior Doctor" role with different permissions.

### Q: What happens to staff if I delete their role?
**A:** You cannot delete a role with assigned staff. First reassign or delete the staff members.

### Q: Can I modify permissions of a system role?
**A:** No, system roles are immutable. Create a custom role instead.

### Q: How are role permissions enforced?
**A:** Currently stored in the database. Frontend can use to show/hide UI. Backend should check permissions before allowing actions.
