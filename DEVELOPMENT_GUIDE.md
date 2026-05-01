# Clinic CRM - Multi-Clinic Architecture Development Guide

## ✅ Completed
- [x] Fixed "Add New Patient" form with better error handling
- [x] Created multi-clinic/multi-branch database schema
- [x] Created TypeScript types and interfaces
- [x] Created database utilities for multi-tenant operations
- [x] Implemented JWT authentication and password management
- [x] Created login/register/logout API routes
- [x] Created middleware for route protection and tenant validation

## 📋 Database Setup Instructions

### 1. Apply the Migration to Supabase

Run this SQL in your Supabase Query Editor:

```sql
-- Paste the contents of lib/db/schema_multi_clinic.sql
-- This will create all the multi-clinic tables and relationships
```

**Steps:**
1. Go to https://app.supabase.com → Your Project
2. Click "SQL Editor" → "New Query"
3. Copy the entire contents of `lib/db/schema_multi_clinic.sql`
4. Paste and run the query
5. Verify all tables are created

### 2. Seed Initial Roles

```sql
-- Insert system roles
INSERT INTO roles (name, description, role_type, permissions, is_system_role)
VALUES 
  ('Super Admin', 'Full system access', 'super_admin', '["manage_organization", "manage_branches", "manage_staff", "manage_patients", "manage_appointments", "manage_prescriptions", "manage_pharmacy", "manage_invoices", "manage_roles", "manage_billing", "view_analytics"]'::jsonb, true),
  ('Clinic Admin', 'Manage clinic and branches', 'clinic_admin', '["manage_branches", "manage_staff", "manage_patients", "manage_appointments", "manage_prescriptions", "manage_pharmacy", "manage_invoices", "view_analytics"]'::jsonb, true),
  ('Branch Admin', 'Manage branch operations', 'branch_admin', '["manage_staff", "manage_patients", "manage_appointments", "manage_prescriptions", "manage_pharmacy", "manage_invoices", "view_analytics"]'::jsonb, true),
  ('Doctor', 'Prescribe and manage patients', 'doctor', '["manage_patients", "write_prescription", "view_analytics"]'::jsonb, true),
  ('Receptionist', 'Book appointments and billing', 'receptionist', '["manage_patients", "book_appointment", "create_invoice", "view_analytics"]'::jsonb, true),
  ('Nurse', 'Patient records and vitals', 'nurse', '["manage_patients", "view_analytics"]'::jsonb, true),
  ('Pharmacist', 'Manage pharmacy', 'pharmacist', '["manage_pharmacy", "dispense_medication", "view_analytics"]'::jsonb, true);
```

## 🔄 Next Steps: Implement Remaining Features

### PHASE 5: Super Admin Panel (Priority: HIGH)
**Goal:** Dashboard for managing organizations, branches, and billing

#### Tasks:
1. **Create Admin Layout Component** (`components/admin/AdminLayout.tsx`)
   - Sidebar with navigation
   - User profile dropdown
   - Org/branch switcher

2. **Organizations Management Page** (`app/admin/organizations/page.tsx`)
   ```typescript
   // Features:
   - List all organizations
   - Create new organization
   - Edit organization details
   - Manage subscription plans
   - View analytics
   - Suspend/activate org
   ```

3. **Branches Management Page** (`app/admin/organizations/[orgId]/branches/page.tsx`)
   ```typescript
   // Features:
   - List branches for org
   - Create new branch
   - Edit branch details
   - Assign branch manager
   - View branch analytics
   ```

4. **Users Management Page** (`app/admin/organizations/[orgId]/users/page.tsx`)
   ```typescript
   // Features:
   - List users by organization
   - Create new user
   - Assign roles and permissions
   - Edit user details
   - Deactivate/reactivate users
   - Reset passwords
   ```

5. **Billing & Subscription Management** (`app/admin/billing/page.tsx`)
   ```typescript
   // Features:
   - View subscription tier for each org
   - Manage payment methods
   - View billing history
   - Handle upgrades/downgrades
   ```

#### API Routes to Create:
```
POST   /api/admin/organizations              - Create org
GET    /api/admin/organizations              - List orgs
PUT    /api/admin/organizations/[id]         - Update org
DELETE /api/admin/organizations/[id]         - Delete org

POST   /api/admin/branches                   - Create branch
GET    /api/admin/branches                   - List branches
PUT    /api/admin/branches/[id]              - Update branch
DELETE /api/admin/branches/[id]              - Delete branch

POST   /api/admin/users                      - Create user
GET    /api/admin/users                      - List users
PUT    /api/admin/users/[id]                 - Update user
DELETE /api/admin/users/[id]                 - Delete user
```

### PHASE 6: Clinic Admin Panel (Priority: HIGH)
**Goal:** Dashboard for clinic admins to manage staff and settings

#### Tasks:
1. **Clinic Dashboard** (`app/clinic/dashboard/page.tsx`)
   - Overview statistics
   - Recent appointments
   - Staff schedules
   - Pending prescriptions

2. **Staff Management** (`app/clinic/staff/page.tsx`)
   ```typescript
   - List staff by role
   - Add new staff member
   - Edit staff details
   - Manage staff schedules
   - View staff performance
   ```

3. **Settings Page** (`app/clinic/settings/page.tsx`)
   ```typescript
   - Clinic information
   - Notification settings
   - WhatsApp integration settings
   - Billing settings
   - API keys management
   ```

### PHASE 7: Pharmacy Module (Priority: MEDIUM)
**Goal:** Complete inventory and prescription fulfillment system

#### Components to Create:
1. **Pharmacy Dashboard** (`app/pharmacy/dashboard/page.tsx`)
   - Stock summary
   - Low stock alerts
   - Expiring products
   - Recent transactions

2. **Inventory Management** (`app/pharmacy/inventory/page.tsx`)
   ```typescript
   - View all products
   - Add new product
   - Update stock
   - Set reorder levels
   - Track batch numbers and expiry
   ```

3. **Prescription Fulfillment** (`app/pharmacy/prescriptions/page.tsx`)
   ```typescript
   - View pending prescriptions
   - Dispense medication
   - Print labels
   - Track fulfillment status
   ```

4. **Suppliers Management** (`app/pharmacy/suppliers/page.tsx`)
   ```typescript
   - Add suppliers
   - Manage pricing
   - Track purchase orders
   - Monitor deliveries
   ```

#### API Routes:
```
POST   /api/pharmacy/products               - Create product
GET    /api/pharmacy/products               - List products
PUT    /api/pharmacy/products/[id]          - Update product

POST   /api/pharmacy/stock                  - Add stock
GET    /api/pharmacy/stock                  - View stock
PUT    /api/pharmacy/stock/[id]             - Update stock

POST   /api/pharmacy/transactions           - Record transaction
GET    /api/pharmacy/transactions           - View transactions

POST   /api/pharmacy/prescriptions/dispense - Dispense prescription
GET    /api/pharmacy/prescriptions          - View pending prescriptions
```

### PHASE 8: Marketing Home Page (Priority: MEDIUM)
**Goal:** Landing page with features, pricing, and call-to-action

#### Pages to Create:
1. **Landing Page** (`app/page.tsx`) - Redesign
   - Hero section with CTA
   - Features showcase
   - Testimonials
   - Pricing comparison button

2. **Features Page** (`app/features/page.tsx`)
   - Multi-clinic management
   - RBAC system
   - Appointment scheduling
   - Prescription management
   - Pharmacy module
   - WhatsApp integration

3. **Pricing Page** (`app/pricing/page.tsx`)
   ```typescript
   Tiers:
   - Free: Basic clinic management
   - Basic: $99/month - Multi-branch support
   - Premium: $299/month - Pharmacy + WhatsApp
   - Enterprise: Custom - Full features + support
   ```

4. **Auth Pages** (Redesign)
   - Login page with org selection
   - Registration page
   - Password reset

#### Components:
- PricingCard component
- FeatureList component
- TestimonialCard component
- CTAButton component

### PHASE 9: WhatsApp Integration (Priority: MEDIUM-HIGH)
**Goal:** Appointment reminders, booking, and notifications

#### Setup Twilio:
1. Sign up at https://www.twilio.com/
2. Get WhatsApp sandbox number
3. Add phone numbers for testing
4. Get API credentials

#### Features to Implement:
1. **Appointment Reminders** (via WhatsApp)
   - 24 hours before
   - 6 hours before
   - 1 hour before

2. **Appointment Booking** (via WhatsApp)
   - Patients can message to book
   - Show available slots
   - Confirm booking

3. **Prescription Notifications**
   - Notify when prescription is ready
   - Provide instructions

4. **Billing Notifications**
   - Invoice generated
   - Payment reminder
   - Receipt after payment

#### API Routes:
```
POST   /api/whatsapp/send                   - Send WhatsApp message
POST   /api/whatsapp/webhook                - Receive WhatsApp messages
GET    /api/whatsapp/templates              - List message templates
POST   /api/whatsapp/templates              - Create template
```

#### Implementation:
```typescript
// lib/whatsapp/index.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppMessage(
  phoneNumber: string,
  messageBody: string
) {
  return client.messages.create({
    from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
    to: `whatsapp:${phoneNumber}`,
    body: messageBody,
  });
}
```

## 🔐 Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars

# Twilio (for WhatsApp)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_number

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password
```

## 📝 Implementation Order

1. **Week 1:**
   - Apply database migrations
   - Install dependencies: `npm install jose`
   - Test login/register endpoints
   - Create super admin panel

2. **Week 2:**
   - Create clinic admin panel
   - Implement staff management
   - Create appointment scheduling for branches

3. **Week 3:**
   - Build pharmacy module
   - Implement inventory management
   - Add prescription fulfillment

4. **Week 4:**
   - Create marketing pages
   - Implement WhatsApp integration
   - Setup notifications

## 🧪 Testing Checklist

- [ ] Super admin can create organizations
- [ ] Clinic admin can create branches
- [ ] Staff can login and see only their data
- [ ] Pharmacy staff can dispense prescriptions
- [ ] WhatsApp reminders send correctly
- [ ] Data is properly isolated by org/branch
- [ ] Users can't access data outside their scope

## 🚀 Deployment Considerations

1. **Security:**
   - Enable Row Level Security (RLS) in Supabase
   - Create RLS policies for multi-tenant isolation
   - Use HTTPS only
   - Implement rate limiting

2. **Performance:**
   - Create database indexes (already in schema)
   - Implement caching for frequently accessed data
   - Use pagination for large datasets

3. **Monitoring:**
   - Setup error tracking (Sentry)
   - Monitor database performance
   - Track API usage

4. **Backup & Recovery:**
   - Enable Supabase automated backups
   - Test restore procedures
   - Document recovery process

## 📚 File Structure Summary

```
lib/
├── auth/
│   └── index.ts                 # JWT and password utilities
├── db/
│   ├── client.ts                # Supabase client
│   ├── multi_tenant_utils.ts    # Multi-tenant helpers
│   ├── schema.sql               # Original schema
│   └── schema_multi_clinic.sql  # New schema
├── types/
│   └── index.ts                 # All TypeScript types
└── whatsapp/
    └── index.ts                 # WhatsApp utilities

app/
├── api/
│   ├── auth/
│   │   └── route.ts             # Login/register/logout
│   ├── admin/
│   │   ├── organizations/
│   │   ├── branches/
│   │   └── users/
│   ├── pharmacy/
│   │   ├── products/
│   │   ├── stock/
│   │   └── prescriptions/
│   └── whatsapp/
│       ├── send/
│       └── webhook/
├── admin/
│   ├── organizations/
│   ├── dashboard/
│   └── settings/
├── clinic/
│   ├── dashboard/
│   ├── staff/
│   └── settings/
├── pharmacy/
│   ├── dashboard/
│   ├── inventory/
│   ├── prescriptions/
│   └── suppliers/
└── auth/
    ├── login/
    ├── register/
    └── reset-password/

components/
├── admin/
│   └── AdminLayout.tsx
├── pharmacy/
│   └── PharmacyLayout.tsx
└── ...
```

## 🎯 Success Metrics

- [ ] 95%+ API test coverage
- [ ] < 100ms API response time
- [ ] Multi-tenant isolation verified
- [ ] All roles working with correct permissions
- [ ] WhatsApp integration fully functional
- [ ] No data leakage between organizations
