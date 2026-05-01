# Clinic CRM - Quick Start Guide

## ⚡ Getting Started (30 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment Variables
Create `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Authentication
JWT_SECRET=your-super-secret-key-at-least-32-characters-long

# Optional: WhatsApp Integration
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Optional: Email Notifications
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

### Step 3: Apply Database Migration

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click "SQL Editor" → "New Query"
4. Copy the entire contents from: `lib/db/schema_multi_clinic.sql`
5. Paste and run the query
6. Verify tables are created

### Step 4: Seed Initial Roles

In SQL Editor, run:

```sql
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

### Step 5: Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## 🔑 Testing Authentication

### Test Login Endpoint

**Create New Organization & User (Registration):**

```bash
curl -X PUT http://localhost:3000/api/auth/route \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "My Clinic",
    "organizationEmail": "clinic@example.com",
    "firstName": "John",
    "lastName": "Admin",
    "email": "admin@clinic.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "country": "USA"
  }'
```

**Login with Credentials:**

```bash
curl -X POST http://localhost:3000/api/auth/route \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinic.com",
    "password": "SecurePass123!",
    "organizationId": "your-org-id"
  }'
```

---

## 📁 Project Structure

```
clinic-crm/
├── app/
│   ├── api/                    # API routes
│   │   └── auth/              # Authentication endpoints
│   ├── patients/              # Patient management (existing)
│   └── ...
├── components/                # React components
├── lib/
│   ├── auth/                  # JWT & password utilities
│   ├── db/                    # Database utilities
│   │   ├── client.ts          # Supabase client
│   │   ├── schema.sql         # Original schema
│   │   └── schema_multi_clinic.sql  # New multi-clinic schema
│   └── types/                 # TypeScript interfaces
├── middleware.ts              # Route protection middleware
├── DEVELOPMENT_GUIDE.md       # Detailed implementation guide
├── IMPLEMENTATION_PLAN.md     # Architecture overview
└── package.json
```

---

## 🧪 Quick Feature Tests

### Test 1: Patient Creation (Existing Feature - Now Fixed)
1. Go to `http://localhost:3000/patients`
2. Click "+ Add New Patient"
3. Fill in the form with:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Phone: +1234567890
   - Date of Birth: 1990-01-15
   - Address: 123 Main St
4. Click "Create Patient"
5. Should see success alert

### Test 2: Create New User (After Auth Setup)
```bash
POST /api/admin/users
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "email": "doctor@clinic.com",
  "password": "DoctorPass123!",
  "firstName": "Jane",
  "lastName": "Doctor",
  "roleId": "<doctor-role-id>",
  "organizationId": "<your-org-id>",
  "specialization": "Cardiology"
}
```

---

## 📊 Remaining Phases

### Phase 1: Super Admin Panel ✅ Foundation Built
- [x] Schema and types created
- [ ] Admin dashboard UI
- [ ] Organization CRUD
- [ ] Branch management
- [ ] User management

### Phase 2: Clinic Admin Panel ✅ Ready for Implementation
- [x] Types and utilities
- [ ] Dashboard
- [ ] Staff management
- [ ] Settings

### Phase 3: Pharmacy Module ✅ Schema Ready
- [x] Database tables
- [ ] Inventory management UI
- [ ] Stock tracking
- [ ] Prescription fulfillment

### Phase 4: Marketing Pages 📋 Design Phase
- [ ] Landing page
- [ ] Features page
- [ ] Pricing page
- [ ] Auth pages redesign

### Phase 5: WhatsApp Integration 🔧 Ready for Setup
- [ ] Twilio account setup
- [ ] Webhook handler
- [ ] Message templates
- [ ] Appointment reminders

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Use HTTPS in production
- [ ] Enable database backups
- [ ] Setup rate limiting
- [ ] Monitor API usage
- [ ] Implement audit logging
- [ ] Secure password reset flow

---

## 🐛 Troubleshooting

### Issue: "Missing environment variables"
**Solution:** Ensure `.env.local` file exists with all required variables

### Issue: "Database connection failed"
**Solution:** 
1. Verify Supabase credentials
2. Check if schema_multi_clinic.sql was applied
3. Ensure roles were seeded

### Issue: "JWT token verification failed"
**Solution:**
1. Check JWT_SECRET is set
2. Ensure token hasn't expired (24h)
3. Verify middleware is not blocking

### Issue: "Access denied when creating patient"
**Solution:** Ensure database migration is complete and tables exist

---

## 📚 Documentation Files

- **DEVELOPMENT_GUIDE.md** - Complete implementation guide for all phases
- **IMPLEMENTATION_PLAN.md** - High-level architecture and timeline
- **API_SETUP.md** - API configuration details
- **This file** - Quick start guide

---

## 📞 Support Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JWT.io](https://jwt.io/) - JWT debugger
- [Twilio Docs](https://www.twilio.com/docs/) - WhatsApp integration

---

## ✨ Next Commands to Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. In another terminal, test the API:
curl http://localhost:3000/api/patients

# 4. Open browser
# http://localhost:3000/auth/login (will need implementation)
# http://localhost:3000/patients (existing page - now with better error handling)
```

---

**Last Updated:** April 19, 2026
**Status:** Foundation Complete ✅ - Ready for Phase Implementation
