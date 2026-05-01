# Appointment Management API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Appointments Endpoint

### GET /appointments
Fetch appointments with role-based filtering.

**Query Parameters:**
- `id` (optional): Get specific appointment
- `patient_id` (optional): Get appointments for specific patient
- `status` (optional): Filter by status (scheduled, ongoing, completed, cancelled)
- `staff_id` (optional): Filter by doctor/staff
- `include_details` (optional): true/false - Include patient, staff, payment details

**Response (include_details=true):**
```json
[
  {
    "id": "uuid",
    "patient_id": "uuid",
    "staff_id": "uuid",
    "appointment_date": "2024-05-15T10:00:00",
    "duration_minutes": 30,
    "appointment_type": "consultation",
    "status": "completed",
    "fee_amount": 50.00,
    "notes": "Patient complains of headache",
    "patients": {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "date_of_birth": "1990-01-01",
      "address": "123 Main St"
    },
    "staff": {
      "id": "uuid",
      "first_name": "Dr",
      "last_name": "Smith",
      "specialization": "General Practice"
    },
    "appointment_payments": [
      {
        "payment_status": "pending",
        "amount_paid": 0,
        "amount_due": 50.00
      }
    ],
    "prescriptions": [
      {
        "id": "uuid",
        "medications": [...],
        "status": "active"
      }
    ]
  }
]
```

**Authorization:** All roles

**Example:**
```bash
curl -X GET "http://localhost:3000/api/appointments?status=completed&include_details=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST /appointments
Create new appointment (Receptionist/Admin only).

**Required Body:**
```json
{
  "patient_id": "uuid",
  "staff_id": "uuid",
  "appointment_date": "2024-05-15T10:00:00",
  "duration_minutes": 30,
  "appointment_type": "consultation",
  "notes": "Optional notes"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "staff_id": "uuid",
  "appointment_date": "2024-05-15T10:00:00",
  "duration_minutes": 30,
  "appointment_type": "consultation",
  "status": "scheduled",
  "fee_amount": null,
  "notes": "Optional notes",
  "patients": {...},
  "staff": {...}
}
```

**Errors:**
- 400: Missing required fields
- 403: Forbidden (not receptionist/admin)
- 409: Scheduling conflict (doctor already booked)

**Authorization:** Receptionist, Clinic Admin, Branch Admin, Super Admin

**Example:**
```bash
curl -X POST "http://localhost:3000/api/appointments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "550e8400-e29b-41d4-a716-446655440000",
    "staff_id": "550e8400-e29b-41d4-a716-446655440001",
    "appointment_date": "2024-05-15T10:00:00",
    "duration_minutes": 30,
    "appointment_type": "consultation",
    "notes": "Follow-up visit"
  }'
```

---

### PUT /appointments?id=<id>
Update appointment status, fees, or details.

**Query Parameter:**
- `id` (required): Appointment ID to update

**Request Body (examples):**

**Doctor Completing Appointment:**
```json
{
  "status": "completed",
  "fee_amount": 75.00,
  "notes_from_doctor": "Patient doing well, continue medication"
}
```

**Receptionist Cancelling:**
```json
{
  "status": "cancelled",
  "cancelled_reason": "Patient requested"
}
```

**Doctor Marking Ongoing:**
```json
{
  "status": "ongoing"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "completed",
  "fee_amount": 75.00,
  "completed_at": "2024-05-15T10:30:00",
  "appointment_payments": [
    {
      "amount_due": 75.00,
      "amount_paid": 0,
      "payment_status": "pending"
    }
  ]
}
```

**Errors:**
- 400: Fee required when completing
- 403: Only assigned doctor can complete
- 404: Appointment not found

**Authorization:** 
- Doctor (can mark ongoing/completed)
- Receptionist/Admin (can cancel)
- Admin (all permissions)

**Example:**
```bash
curl -X PUT "http://localhost:3000/api/appointments?id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "fee_amount": 75.00,
    "notes_from_doctor": "Appointment completed successfully"
  }'
```

---

### DELETE /appointments?id=<id>
Delete appointment (Admin only).

**Query Parameter:**
- `id` (required): Appointment ID to delete

**Response (200):**
```json
{
  "message": "Appointment deleted successfully"
}
```

**Errors:**
- 403: Forbidden (not admin)
- 404: Appointment not found

**Authorization:** Clinic Admin, Branch Admin, Super Admin

---

## Payments Endpoint

### GET /appointments/payments
Fetch payment records.

**Query Parameters:**
- `appointment_id` (optional): Get payment for specific appointment
- `payment_status` (optional): Filter by status (pending, partial, paid, overdue)

**Response:**
```json
[
  {
    "id": "uuid",
    "appointment_id": "uuid",
    "amount_due": 75.00,
    "amount_paid": 50.00,
    "payment_method": "cash",
    "payment_status": "partial",
    "paid_date": null,
    "payment_reference": null,
    "notes": "First installment",
    "appointment": {
      "id": "uuid",
      "appointment_date": "2024-05-15T10:00:00",
      "appointment_type": "consultation"
    }
  }
]
```

**Authorization:** All roles

---

### POST /appointments/payments
Record payment for appointment.

**Request Body:**
```json
{
  "appointment_id": "uuid",
  "amount_paid": 50.00,
  "payment_method": "cash",
  "payment_reference": "optional-transaction-id",
  "notes": "partial payment"
}
```

**Payment Methods:**
- `cash`
- `card`
- `upi`
- `cheque`
- `bank_transfer`

**Response (201):**
```json
{
  "id": "uuid",
  "appointment_id": "uuid",
  "amount_due": 75.00,
  "amount_paid": 50.00,
  "payment_method": "cash",
  "payment_status": "partial",
  "paid_date": null,
  "updated_at": "2024-05-15T11:00:00"
}
```

**Payment Status Auto-Calculation:**
- If `amount_paid == 0`: status = "pending"
- If `0 < amount_paid < amount_due`: status = "partial"
- If `amount_paid >= amount_due`: status = "paid"

**Errors:**
- 400: Missing amount_paid or appointment_id
- 403: Forbidden (not receptionist/admin)
- 404: Payment record not found

**Authorization:** Receptionist, Clinic Admin, Branch Admin, Super Admin

**Example:**
```bash
curl -X POST "http://localhost:3000/api/appointments/payments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount_paid": 50.00,
    "payment_method": "card",
    "payment_reference": "TXN123456",
    "notes": "Credit card payment"
  }'
```

---

### PUT /appointments/payments?id=<id>
Update payment record (Admin only).

**Query Parameter:**
- `id` (required): Payment ID to update

**Request Body:**
```json
{
  "payment_method": "card",
  "payment_reference": "NEW_REF",
  "notes": "Updated notes"
}
```

**Authorization:** Clinic Admin, Branch Admin, Super Admin

---

## Prescriptions Endpoint

### GET /prescriptions
Fetch prescriptions (Doctors see own; others see all).

**Query Parameters:**
- `id` (optional): Get specific prescription
- `patient_id` (optional): Get prescriptions for patient
- `appointment_id` (optional): Get prescriptions for appointment
- `status` (optional): Filter by status (active, dispensed, expired)

**Response:**
```json
[
  {
    "id": "uuid",
    "patient_id": "uuid",
    "staff_id": "uuid",
    "appointment_id": "uuid",
    "medications": [
      {
        "name": "Amoxicillin",
        "dosage": "500mg",
        "frequency": "3 times daily",
        "duration": "7 days"
      }
    ],
    "issued_date": "2024-05-15",
    "expiry_date": "2025-05-15",
    "status": "active",
    "is_dispensed": false,
    "dispensed_date": null,
    "notes": "Take with food",
    "patients": {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe"
    },
    "staff": {
      "id": "uuid",
      "first_name": "Dr",
      "last_name": "Smith"
    },
    "appointments": {
      "id": "uuid",
      "appointment_date": "2024-05-15T10:00:00",
      "appointment_type": "consultation"
    }
  }
]
```

**Authorization:** All roles (Doctors see only their own)

---

### POST /prescriptions
Create prescription (Doctor only).

**Request Body:**
```json
{
  "patient_id": "uuid",
  "appointment_id": "uuid",
  "medications": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "7 days",
      "notes": "Take with food"
    }
  ],
  "issued_date": "2024-05-15",
  "expiry_date": "2025-05-15",
  "notes": "For bacterial infection"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "staff_id": "uuid-of-logged-in-doctor",
  "appointment_id": "uuid",
  "medications": [...],
  "issued_date": "2024-05-15",
  "status": "active",
  "is_dispensed": false
}
```

**Errors:**
- 403: Forbidden (only doctor can create)
- 400: Invalid appointment (doctor doesn't own)

**Authorization:** Doctor role

**Example:**
```bash
curl -X POST "http://localhost:3000/api/prescriptions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "550e8400-e29b-41d4-a716-446655440000",
    "appointment_id": "550e8400-e29b-41d4-a716-446655440001",
    "medications": [
      {
        "name": "Amoxicillin",
        "dosage": "500mg",
        "frequency": "3 times daily",
        "duration": "7 days"
      }
    ],
    "notes": "For bacterial infection"
  }'
```

---

### PUT /prescriptions?id=<id>
Update prescription.

**Doctor can update:** medications, status, notes
**Receptionist can:** mark as dispensed

**Request Body (Doctor):**
```json
{
  "medications": [...],
  "status": "active",
  "notes": "Updated notes"
}
```

**Request Body (Receptionist):**
```json
{
  "is_dispensed": true
}
```

**Authorization:** 
- Doctor (own prescriptions only)
- Receptionist/Admin (can mark as dispensed)
- Admin (all permissions)

---

### DELETE /prescriptions?id=<id>
Delete prescription (Admin only).

**Authorization:** Clinic Admin, Branch Admin, Super Admin

---

## Error Responses

All errors return appropriate HTTP status codes and error messages:

```json
{
  "error": "Error message",
  "status": 400
}
```

**Common Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict (e.g., scheduling conflict)
- 500: Server Error

---

## Role-Based Permissions Summary

| Action | Doctor | Receptionist | Admin |
|--------|--------|--------------|-------|
| View Own Appointments | ✓ | ✗ | ✓ |
| View All Appointments | ✗ | ✓ | ✓ |
| Create Appointment | ✗ | ✓ | ✓ |
| Cancel Appointment | ✗ | ✓ | ✓ |
| Complete Appointment | ✓ | ✗ | ✓ |
| Set Fee | ✓ | ✗ | ✓ |
| View Fees | ✓ | ✓ | ✓ |
| Record Payment | ✗ | ✓ | ✓ |
| Create Prescription | ✓ | ✗ | ✓ |
| View Prescription | ✓* | ✓ | ✓ |
| Mark Dispensed | ✗ | ✓ | ✓ |
| Delete Appointment | ✗ | ✗ | ✓ |
| Delete Prescription | ✗ | ✗ | ✓ |

*Doctor sees only their own prescriptions
