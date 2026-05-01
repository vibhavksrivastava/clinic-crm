# Appointment Management System - Implementation Summary

## Overview
This document describes the comprehensive appointment management system that has been implemented with support for multi-role workflows, fee tracking, and payment management.

## Implemented Features

### 1. **Back Button to Dashboard** ✅
- Added back button at the top of the appointments page
- Navigates to `/admin` dashboard
- Located above the page title for easy access

### 2. **Patient Row Click - View Details** ✅
- Clicking on a patient name in the appointments table opens a modal
- Shows all available patient details:
  - Full name
  - Email
  - Phone
  - Date of birth
  - Address
  - Current appointment information
  - Appointment type and date/time
- Modal is closeable with the X button

### 3. **Multiple Appointment Status Tabs** ✅
- 4 tabs displaying different appointment statuses:
  - **Scheduled**: Upcoming appointments not yet started
  - **Ongoing**: Appointments that have been started by the doctor
  - **Completed**: Finished appointments
  - **Cancelled**: Cancelled appointments
- Tab counter shows number of appointments in each status
- Easy switching between different views

### 4. **Doctor Role - Complete Appointment with Fees** ✅
- Doctor can only see appointments assigned to them
- Doctor has two action buttons:
  - **Mark Ongoing**: Transitions appointment from scheduled → ongoing
  - **Complete**: Opens modal to complete the appointment
- Completion modal requires:
  - **Fee Amount** (required): Total fees for the appointment
  - **Doctor Notes**: Optional notes from the doctor
- Upon completion:
  - Appointment status changes to "completed"
  - Fee amount is recorded
  - Payment record is created
  - Doctor notes are saved

### 5. **Doctor Role - Add Prescriptions** ✅
- Doctor can add prescriptions to appointments via the enhanced `/api/prescriptions` endpoint
- Prescriptions are linked to appointments via `appointment_id`
- Prescription includes:
  - Medications (array of medication details)
  - Status (active, dispensed, expired)
  - Issue date and expiry date
  - Doctor notes
- Only the prescribing doctor can view/modify their prescriptions

### 6. **Receptionist Role - View Prescriptions and Fees** ✅
- Receptionist can see completed appointments with:
  - Associated prescriptions (linked via `appointment_id`)
  - Appointment fees
  - Payment status
- Prescriptions show:
  - Medication list
  - Status
  - Dispensing information
- Fees are displayed in the appointments table

### 7. **Receptionist Role - Mark Payment as Paid** ✅
- When viewing completed appointments, receptionist has "Record Payment" button
- Payment recording modal allows receptionist to:
  - Enter payment amount
  - Select payment method:
    - Cash
    - Card
    - UPI
    - Cheque
  - Add payment reference (Transaction ID, Cheque No, etc.)
  - Add payment notes
- Payment status updates to:
  - "pending" (no payments made)
  - "partial" (partial payment received)
  - "paid" (full payment received)

### 8. **Receptionist Role - Add/Cancel Appointments** ✅
- Receptionist has button to create new appointments
- "Schedule Appointment" form allows receptionist to:
  - Select patient
  - Select doctor
  - Set appointment date and time
  - Choose duration (15, 30, 45, 60 minutes)
  - Select appointment type (consultation, follow-up, procedure)
  - Add notes
- Automatic conflict detection prevents double-booking
- Receptionist can cancel appointments via the "Cancel" button
- Cancellation includes confirmation dialog

### 9. **Comprehensive Appointment Views** ✅
- All users can view appointments filtered by status
- Each appointment displays:
  - Patient name (clickable for details)
  - Doctor/Staff name
  - Date and time
  - Appointment type
  - Fee amount
  - Payment status
  - Action buttons (status-specific)
- Appointments are sorted by date
- Comprehensive table with all essential information

### 10. **Role-Based Access Control** ✅
- **Doctor**:
  - Can view only their own appointments
  - Can mark appointments as ongoing
  - Can complete appointments (with fee entry)
  - Cannot create, cancel, or delete appointments
  - Can add prescriptions to their appointments
  
- **Receptionist**:
  - Can view all appointments
  - Can create new appointments
  - Can cancel appointments
  - Cannot complete appointments
  - Can record payments
  - Can view prescriptions and fees
  
- **Admin/Clinic Admin**:
  - Full permissions
  - Can perform all actions
  - Can delete appointments

## Database Schema Updates

### New/Updated Tables

#### 1. **Appointments Table - New Columns**
```sql
- appointment_type VARCHAR(50) -- consultation, follow-up, procedure
- fee_amount DECIMAL(10, 2) -- Appointment fee set by doctor
- fee_description TEXT -- Optional fee description
- notes_from_doctor TEXT -- Doctor's notes from appointment
- completed_at TIMESTAMP -- When appointment was completed
- cancelled_reason TEXT -- Reason for cancellation
```

#### 2. **Prescriptions Table - New Columns**
```sql
- appointment_id UUID -- Link to specific appointment
- is_dispensed BOOLEAN -- Whether prescription was dispensed
- dispensed_date TIMESTAMP -- When dispensed
- dispensed_by_id UUID -- Staff member who dispensed
```

#### 3. **New Table: Appointment Payments**
```sql
CREATE TABLE appointment_payments (
  id UUID PRIMARY KEY
  appointment_id UUID -- Foreign key to appointments
  amount_due DECIMAL(10, 2) -- Total amount due
  amount_paid DECIMAL(10, 2) -- Amount received so far
  payment_method VARCHAR(50) -- cash, card, upi, cheque, bank_transfer
  payment_status VARCHAR(50) -- pending, partial, paid, overdue
  paid_date TIMESTAMP -- When full payment was received
  paid_by_id UUID -- Staff member recording payment
  payment_reference VARCHAR(100) -- Transaction ID, Cheque No, etc.
  notes TEXT
  created_at TIMESTAMP
  updated_at TIMESTAMP
  UNIQUE(appointment_id) -- One payment record per appointment
)
```

#### 4. **New Table: Appointment Notes**
```sql
CREATE TABLE appointment_notes (
  id UUID PRIMARY KEY
  appointment_id UUID
  created_by_id UUID
  note_type VARCHAR(50) -- general, diagnosis, treatment, follow_up
  note_content TEXT
  is_private BOOLEAN
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

#### 5. **New Table: Appointment Status Logs**
```sql
CREATE TABLE appointment_status_logs (
  id UUID PRIMARY KEY
  appointment_id UUID
  previous_status VARCHAR(50)
  new_status VARCHAR(50)
  changed_by_id UUID
  reason TEXT
  created_at TIMESTAMP
)
```

## API Endpoints

### Appointments API
- **GET** `/api/appointments` - Fetch appointments (filtered by role)
  - Query params: `id`, `patient_id`, `status`, `staff_id`, `include_details`
  - Returns full patient/staff details with `include_details=true`
  
- **POST** `/api/appointments` - Create new appointment (Receptionist/Admin only)
  - Body: `patient_id`, `staff_id`, `appointment_date`, `duration_minutes`, `appointment_type`, `notes`
  - Auto-creates payment record
  
- **PUT** `/api/appointments?id=<id>` - Update appointment status/details
  - Doctor: Can mark as `ongoing` or `completed` (with `fee_amount`)
  - Receptionist/Admin: Can mark as `cancelled`
  - Auto-logs status changes
  
- **DELETE** `/api/appointments?id=<id>` - Delete appointment (Admin only)

### Payments API
- **GET** `/api/appointments/payments` - Fetch payment records
  - Query params: `appointment_id`, `payment_status`
  
- **POST** `/api/appointments/payments` - Record payment (Receptionist/Admin only)
  - Body: `appointment_id`, `amount_paid`, `payment_method`, `payment_reference`, `notes`
  - Auto-calculates payment status
  
- **PUT** `/api/appointments/payments?id=<id>` - Update payment (Admin only)

### Prescriptions API
- **GET** `/api/prescriptions` - Fetch prescriptions
  - Query params: `id`, `patient_id`, `appointment_id`, `status`
  - Doctors see only their own; others see all
  
- **POST** `/api/prescriptions` - Create prescription (Doctor only)
  - Body: `patient_id`, `medications`, `appointment_id`, `notes`
  - Uses current user as prescriber
  
- **PUT** `/api/prescriptions?id=<id>` - Update prescription
  - Doctors can update their own
  - Receptionist can mark as dispensed
  
- **DELETE** `/api/prescriptions?id=<id>` - Delete prescription (Admin only)

## Frontend Components

### Appointments Page (`app/appointments/page.tsx`)
Main component featuring:
- Tab navigation for appointment statuses
- Appointment scheduling form (Receptionist only)
- Appointments table with role-based actions
- Patient details modal (click patient name)
- Doctor completion modal (fee entry)
- Payment recording modal (payment entry)
- Auto-role detection from JWT token
- Real-time data fetching and updates

## Workflow Examples

### Example 1: Complete Appointment as Doctor
1. Doctor logs in and views "Scheduled" appointments
2. Finds their appointment and clicks "Mark Ongoing"
3. Appointment status changes to "Ongoing"
4. Doctor clicks "Complete" button
5. Modal appears asking for:
   - Appointment fee (e.g., $50)
   - Optional notes
6. Doctor can now add prescription separately via prescription API
7. Status changes to "Completed" and fee is recorded

### Example 2: Process Payment as Receptionist
1. Receptionist views "Completed" appointments
2. Finds appointment with pending payment
3. Patient gives $50 cash payment
4. Receptionist clicks "Record Payment"
5. Receptionist fills in:
   - Amount Paid: 50
   - Payment Method: Cash
   - Reference: (empty for cash)
   - Notes: (optional)
6. Click "Record Payment"
7. Payment status updates to "paid" (if full payment)

### Example 3: Schedule and Track Full Appointment
1. Receptionist schedules appointment:
   - Patient: John Doe
   - Doctor: Dr. Smith
   - Date: Tomorrow 10 AM
   - Duration: 30 min
   - Type: Consultation
2. Appointment appears in "Scheduled" tab
3. On appointment day:
   - Doctor marks as "Ongoing"
   - Doctor marks as "Complete" with $75 fee
4. Appointment moves to "Completed" tab
5. Doctor adds prescription
6. Receptionist records $75 cash payment
7. Payment status shows "paid"

## Security and Authorization

All endpoints include role-based access control:
- **getUserContext()** extracts and verifies JWT token
- **roleType** determines allowed actions
- Doctors can only see/modify their own appointments
- Receptionists cannot complete appointments (only doctors)
- Admins have full access
- Unauthorized requests return 403 Forbidden

## Data Validation

- Appointment date/time validation
- Automatic conflict detection (prevents double-booking)
- Fee amount required to complete appointment
- Payment amount validated against due amount
- Role-based action validation

## Audit Trail

Status changes logged in `appointment_status_logs` table:
- Previous status
- New status
- Who changed it
- When it changed
- Reason (for cancellations)

## Future Enhancements

1. **Appointment Reminders**: SMS/Email notifications 24 hours before
2. **Rescheduling**: Allow rescheduling without deleting/recreating
3. **Bulk Payment**: Handle multiple appointments at once
4. **Refunds**: Support partial/full refunds
5. **Analytics**: Dashboard with appointment stats and revenue
6. **Recurring Appointments**: Support for follow-ups and recurring bookings
7. **Insurance Integration**: Handle insurance claims and co-pays
8. **Patient Confirmations**: Patients can confirm/reschedule appointments

## Testing Checklist

- [ ] Schedule appointment (Receptionist)
- [ ] View scheduled appointments (Doctor)
- [ ] Mark as ongoing (Doctor)
- [ ] Complete appointment with fees (Doctor)
- [ ] Add prescription (Doctor)
- [ ] View completed appointments (Receptionist)
- [ ] Record payment (Receptionist)
- [ ] View payment status changes (all roles)
- [ ] Cancel appointment (Receptionist)
- [ ] Verify conflict detection
- [ ] Verify role-based permissions
- [ ] Test patient details modal
- [ ] Test all status tabs
