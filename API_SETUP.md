# API Setup Guide

## Database Configuration

### 1. Update Environment Variables

Edit `.env.local` and replace `YOUR_PASSWORD_HERE` with your actual Supabase password:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@db.lfvgmrecdyyrxvzjmlgp.supabase.co:5432/postgres
```

### 2. Create Database Tables

Run the SQL schema on your Supabase database. Go to your Supabase dashboard:

1. Click on "SQL Editor" in the sidebar
2. Create a new query
3. Copy the entire contents of `lib/db/schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to create all tables and indexes

**Note:** The schema uses UUID primary keys (Supabase default) instead of auto-incrementing integers. All foreign keys are properly typed as UUID.

### 3. API Endpoints

All endpoints return JSON data. Query parameters use `?id=VALUE` to get specific records.

#### Patients
- **GET** `/api/patients` - Get all patients
- **GET** `/api/patients?id=550e8400-e29b-41d4-a716-446655440000` - Get specific patient (use UUID)
- **POST** `/api/patients` - Create patient
- **PUT** `/api/patients?id=550e8400-e29b-41d4-a716-446655440000` - Update patient
- **DELETE** `/api/patients?id=550e8400-e29b-41d4-a716-446655440000` - Delete patient

Request body example (POST/PUT):
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15",
  "address": "123 Main St"
}
```

#### Appointments
- **GET** `/api/appointments` - Get all appointments
- **GET** `/api/appointments?id=1` - Get specific appointment
- **POST** `/api/appointments` - Schedule appointment
- **PUT** `/api/appointments?id=1` - Update appointment status
- **DELETE** `/api/appointments?id=1` - Cancel appointment

Request body example (POST):
```json
{
  "patient_id": 1,
  "staff_id": 1,
  "appointment_date": "2024-05-20T14:00:00Z",
  "duration_minutes": 30,
  "notes": "Routine checkup"
}
```

#### Prescriptions
- **GET** `/api/prescriptions` - Get all prescriptions
- **POST** `/api/prescriptions` - Create prescription
- **PUT** `/api/prescriptions?id=1` - Update prescription
- **DELETE** `/api/prescriptions?id=1` - Delete prescription

Request body example (POST):
```json
{
  "patient_id": 1,
  "staff_id": 1,
  "medication_name": "Aspirin",
  "dosage": "500mg",
  "frequency": "Once daily",
  "quantity": 30,
  "issued_date": "2024-05-15",
  "expiry_date": "2025-05-15",
  "notes": "For pain relief"
}
```

#### Staff
- **GET** `/api/staff` - Get all staff
- **POST** `/api/staff` - Add staff member
- **PUT** `/api/staff?id=1` - Update staff
- **DELETE** `/api/staff?id=1` - Remove staff

Request body example (POST):
```json
{
  "first_name": "Dr.",
  "last_name": "Smith",
  "email": "smith@clinic.com",
  "role": "Doctor",
  "phone": "+1234567890",
  "specialization": "General Practice"
}
```

#### Invoices
- **GET** `/api/invoices` - Get all invoices
- **POST** `/api/invoices` - Create invoice
- **PUT** `/api/invoices?id=1` - Update invoice status
- **DELETE** `/api/invoices?id=1` - Delete invoice

Request body example (POST):
```json
{
  "patient_id": 1,
  "appointment_id": 1,
  "amount": 150.00,
  "due_date": "2024-06-15",
  "notes": "Consultation fee"
}
```

### 4. Testing the API

Use any HTTP client (Postman, curl, etc.) to test:

```bash
# Get all patients
curl http://localhost:3000/api/patients

# Create a patient
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }'
```

### 5. Troubleshooting

**Error: DATABASE_URL is not set**
- Make sure `.env.local` exists with the correct database URL
- Restart the dev server after updating env variables

**Error: Connection refused**
- Verify the Supabase credentials are correct
- Check if the database URL is properly formatted
- Ensure your IP is whitelisted in Supabase network settings (if applicable)

**Tables not found**
- Run the SQL schema from `lib/db/schema.sql` in Supabase SQL Editor
- Verify all tables were created: `\dt` in SQL editor
