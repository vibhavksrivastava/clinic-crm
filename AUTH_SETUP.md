# Clinic CRM - Authentication Setup Guide

## Quick Start - Demo User Setup

### Option 1: One-Click Demo Setup (Recommended)

1. Go to the login page: `http://localhost:3000/login`
2. Click the **"🚀 Initialize Demo User"** button
3. The system will create:
   - Demo Organization: "Demo Clinic"
   - Demo User: admin@clinic.com / demo123

### Option 2: Manual Database Setup

#### Step 1: Run SQL Schema

In your Supabase dashboard, go to SQL Editor and run:

```sql
-- =============================================
-- Authentication Schema Setup
-- =============================================

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Or** if you need to add columns to existing table:

```sql
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

-- Roles Table
```sql
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, name)
);
```

-- Branches Table
```sql
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

-- Users Table (Core authentication table)
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Status fields
  user_status VARCHAR(50) DEFAULT 'active' CHECK (user_status IN ('active', 'inactive', 'suspended', 'deleted')),
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  phone_verified_at TIMESTAMP,
  
  -- Multi-tenancy fields
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  role VARCHAR(50) DEFAULT 'user',
  
  -- Auth fields
  last_login TIMESTAMP,
  login_count INT DEFAULT 0,
  failed_login_attempts INT DEFAULT 0,
  last_failed_login TIMESTAMP,
  locked_until TIMESTAMP,
  password_changed_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

-- Login History Table
```sql
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

-- Password Reset Tokens Table
```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

-- Sessions Table
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

-- Create indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_sessions_token ON sessions(token);
```
```

#### Step 2: Create Demo Organization

```sql
INSERT INTO organizations (name, email, phone, address, city, is_active)
VALUES (
  'Demo Clinic',
  'demo@clinic.com',
  '(555) 000-0000',
  '123 Medical Street',
  'Health City',
  TRUE
)
ON CONFLICT DO NOTHING;
```

#### Step 3: Create Demo User

Use the API endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "setupKey": "clinic-crm-setup-2026"
  }'
```

Or via the login page button.

---

## Environment Variables

Add these to your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your-jwt-secret-key-change-in-production
```

---

## Login Credentials (After Setup)

- **Email:** admin@clinic.com
- **Password:** demo123
- **Role:** super_admin

---

## API Endpoints

### Authentication Endpoints

#### Login
```bash
POST /api/auth
Content-Type: application/json

{
  "email": "admin@clinic.com",
  "password": "demo123"
}
```

Response:
```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "admin@clinic.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "super_admin"
  }
}
```

#### Setup Demo User
```bash
POST /api/auth/setup
Content-Type: application/json

{
  "setupKey": "clinic-crm-setup-2026"
}
```

#### Check Setup Status
```bash
GET /api/auth/setup
```

---

## Security Notes

⚠️ **Important for Production:**

1. **Change JWT_SECRET** - Use a strong, unique secret
2. **Update Setup Key** - Change `clinic-crm-setup-2026` to something secure
3. **Use bcrypt/argon2** - Replace PBKDF2 with bcrypt or argon2 for password hashing
4. **Enable HTTPS** - Always use HTTPS in production
5. **Rate Limiting** - Implement rate limiting on login attempts
6. **CORS** - Configure CORS properly for your domain

---

## Troubleshooting

### "Invalid email or password"
- Check if the users table exists in Supabase
- Run the setup endpoint to create the demo user
- Verify the password hash format in the database

### "Failed to create demo user"
- Ensure organizations table exists
- Check that JWT_SECRET is set in environment
- Verify Supabase credentials

### Token not persisting
- Check if localStorage is enabled
- Clear browser cache and try again
- Check browser console for errors

---

## Next Steps

1. ✅ Login with demo credentials
2. ✅ Navigate to admin panel
3. ✅ Add more users and roles
4. ✅ Configure organization and branches
5. ✅ Set up staff members
