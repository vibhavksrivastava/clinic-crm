# Clinic CRM - Comprehensive Implementation Plan

## Phase 1: Immediate Fixes (Today)
- [ ] Debug and fix "Add New Patient" UI issue
- [ ] Verify form submission handling
- [ ] Test all form validations

## Phase 2: Database Schema - Multi-Clinic/Multi-Branch Architecture (Days 1-2)

### New Tables Required:
```
1. organizations (clinics)
   - id (UUID)
   - name (VARCHAR)
   - description (TEXT)
   - logo_url (VARCHAR)
   - address, city, country, postal_code
   - phone, email
   - subscription_plan (free, basic, premium)
   - status (active, inactive, suspended)
   - created_at, updated_at

2. branches
   - id (UUID)
   - organization_id (UUID) - FK to organizations
   - name (VARCHAR)
   - description (TEXT)
   - address, city, country, postal_code
   - phone, email
   - manager_id (UUID) - FK to users
   - status (active, inactive)
   - created_at, updated_at

3. users (replaces implicit staff)
   - id (UUID)
   - email (VARCHAR) - UNIQUE
   - password_hash (VARCHAR)
   - first_name, last_name
   - phone
   - role_id (UUID) - FK to roles
   - organization_id (UUID) - FK to organizations
   - branch_id (UUID) - FK to branches (null for super admin)
   - status (active, inactive, pending)
   - last_login
   - created_at, updated_at

4. roles
   - id (UUID)
   - name (super_admin, admin, doctor, receptionist, nurse, pharmacist)
   - description
   - permissions (JSONB array of permission codes)

5. permissions_matrix (org/branch level)
   - id (UUID)
   - role_id (UUID)
   - organization_id (UUID) - null for system-wide
   - can_manage_staff, can_manage_patients, can_write_prescription, etc.

6. patients
   - (existing + organization_id, branch_id)

7. staff (legacy - keep for compatibility, map to users table)

8. pharmacy_products
   - id (UUID)
   - organization_id (UUID)
   - branch_id (UUID)
   - name, description
   - sku, barcode
   - unit_price, cost_price
   - stock_quantity
   - reorder_level
   - supplier_id (UUID)
   - category (VARCHAR)

9. pharmacy_stock
   - id (UUID)
   - product_id (UUID)
   - branch_id (UUID)
   - quantity, expiry_date, batch_number

10. prescriptions (update with pharmacy tracking)
    - (existing fields + pharmacy_status, dispensed_by_id, dispensed_date)
```

## Phase 3: Authentication & Authorization (Days 2-3)

### Implementation:
1. **Auth System**
   - NextAuth.js v5 or similar
   - JWT tokens with org/branch context
   - Session management

2. **Role-Based Access Control (RBAC)**
   - Super Admin: Full system control
   - Clinic Admin: Manage clinic, branches, staff
   - Branch Manager: Manage branch staff and settings
   - Doctor: Write prescriptions, view patients
   - Receptionist: Book appointments, manage billing
   - Pharmacist: Manage pharmacy, fill prescriptions
   - Nurse: Patient records, vital signs

3. **Permission Checks**
   - Middleware for API routes
   - Protected components
   - Data filtering by org/branch

## Phase 4: Multi-Clinic/Branch Features (Days 3-4)

### Super Admin Panel:
- Organization management (CRUD)
- Branch management
- User management (assign users to orgs/branches)
- Subscription/billing management
- System-wide analytics

### Clinic Admin Panel:
- Staff management (doctors, nurses, receptionists)
- Prescription templates
- Billing configurations
- Analytics by branch

### Branch-Level Features:
- Patient management scoped to branch
- Doctor schedules per branch
- Appointment slots per branch

## Phase 5: Pharmacy Module (Days 5-6)

### Features:
1. **Inventory Management**
   - Product catalog
   - Stock tracking
   - Expiry alerts
   - Low stock alerts

2. **Prescription Fulfillment**
   - Pharmacist receives prescriptions
   - Dispense medications
   - Print labels
   - Inventory deduction

3. **Supplier Management**
   - Purchase orders
   - Delivery tracking
   - Price management

## Phase 6: Marketing Home Page (Day 7)

### Pages:
1. **Landing Page**
   - Features showcase
   - Pricing plans
   - Testimonials
   - CTA to login/signup

2. **Pricing Page**
   - Subscription tiers (Free, Basic, Premium, Enterprise)
   - Feature comparison
   - Signup CTA

3. **Features Page**
   - Multi-clinic support
   - RBAC system
   - Pharmacy integration
   - WhatsApp integration

4. **Auth Pages**
   - Login (organization-based)
   - Signup (create organization)
   - Password reset

## Phase 7: WhatsApp Integration (Days 8-9)

### Features:
1. **Twilio WhatsApp API**
   - Appointment reminders
   - Appointment booking via WhatsApp
   - Prescription ready notifications
   - Follow-up messages

2. **Message Templates**
   - Appointment confirmation
   - Appointment reminder (24h, 6h, 1h before)
   - Prescription ready
   - Bill generated
   - Custom messages

3. **Webhook Handler**
   - Receive incoming WhatsApp messages
   - Parse appointment booking requests
   - Update appointment status

## Phase 8: Feature-Specific Role Permissions

### Doctor:
- ✓ View own patients
- ✓ Write prescriptions
- ✓ View appointments
- ✗ Book appointments
- ✗ Manage billing

### Receptionist:
- ✓ Book appointments
- ✓ Create/view patients
- ✓ Generate invoices
- ✓ Print prescriptions
- ✗ Write prescriptions
- ✗ Manage doctors

### Pharmacist:
- ✓ View prescriptions (pharmacy status)
- ✓ Manage pharmacy stock
- ✓ Dispense medications
- ✓ Track inventory
- ✗ Write prescriptions
- ✗ Book appointments

## Implementation Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1 (Fixes) | 1 day | CRITICAL |
| Phase 2 (Schema) | 2 days | HIGH |
| Phase 3 (Auth) | 2 days | HIGH |
| Phase 4 (Features) | 2 days | HIGH |
| Phase 5 (Pharmacy) | 2 days | MEDIUM |
| Phase 6 (Marketing) | 1 day | MEDIUM |
| Phase 7 (WhatsApp) | 2 days | MEDIUM |
| Phase 8 (Refinement) | 2 days | MEDIUM |

**Total: 14 days**

## Current Status
- ✓ API routes working (verified patient creation)
- ✓ Basic schema in place
- ✓ Next.js 15+ setup
- ✗ Multi-clinic architecture missing
- ✗ Authentication system missing
- ✗ Pharmacy module missing
- ✗ Marketing site missing
- ✗ WhatsApp integration missing
