# Appointment Management - Quick Start Guide

## For Receptionists

### Schedule a New Appointment
1. Click **"+ Schedule Appointment"** button (blue button)
2. Fill in the form:
   - **Select Patient**: Choose patient from dropdown
   - **Select Doctor**: Choose doctor from dropdown
   - **Date**: Pick appointment date
   - **Time**: Pick appointment time
   - **Duration**: Select duration (15, 30, 45, 60 minutes)
   - **Type**: Choose consultation, follow-up, or procedure
   - **Notes**: Add any special notes
3. Click **"Schedule Appointment"** button
4. Appointment will appear in "Scheduled" tab

### View Appointments
- Click on tabs to see different appointment statuses:
  - **Scheduled**: Upcoming appointments
  - **Ongoing**: Currently in progress
  - **Completed**: Finished appointments
  - **Cancelled**: Cancelled appointments

### Click Patient Name to View Details
- Click on any patient name in the table
- Modal pops up showing all patient information:
  - Contact details
  - Address
  - Birth date
  - Current appointment info

### Cancel an Appointment
1. Find appointment in "Scheduled" or "Ongoing" tab
2. Click **"Cancel"** button
3. Confirm cancellation in dialog

### Record Payment
1. Find completed appointment in "Completed" tab
2. Click **"Record Payment"** button
3. Fill payment details:
   - **Amount Paid**: Enter amount received
   - **Payment Method**: Select cash, card, UPI, or cheque
   - **Reference**: Enter transaction ID if applicable
   - **Notes**: Add any notes
4. Click **"Record Payment"**
5. Payment status updates to "paid" or "partial"

---

## For Doctors

### View Your Appointments
1. Log in as doctor
2. Go to Appointments page
3. You will only see appointments assigned to you
4. View tabs: Scheduled, Ongoing, Completed, Cancelled

### Click Patient Name for Details
- Click patient name to see full patient details
- Includes contact info, address, and appointment type

### Start an Appointment
1. Find appointment in "Scheduled" tab
2. Click **"Mark Ongoing"** button
3. Appointment moves to "Ongoing" tab

### Complete an Appointment
1. Find appointment in "Scheduled" or "Ongoing" tab
2. Click **"Complete"** button
3. Modal appears requesting:
   - **Fee Amount** (required): Enter consultation fee
   - **Doctor Notes**: Add appointment notes if needed
4. Click **"Complete"**
5. Appointment moves to "Completed" tab
6. Fee is recorded for billing

### Add Prescription to Patient
1. After completing appointment, use `/api/prescriptions` endpoint or UI to add:
   - Patient ID
   - Appointment ID (links to the specific appointment)
   - Medications list
   - Any notes
2. Prescription is now linked to the completed appointment

### View Your Prescriptions
- Prescriptions are available in the prescriptions section
- You only see prescriptions you created
- Can view dispensing status

---

## For Clinic Admin

### Dashboard View
- Can see all appointments across all doctors
- Can see all patients and their appointment history
- Can manage all payments and fees

### Actions
- Can perform any receptionist action (schedule, cancel, record payment)
- Can perform any doctor action (complete appointment)
- Can delete appointments if needed
- Has access to all reports and analytics

---

## Appointment Status Flow

```
Scheduled → Ongoing → Completed
    ↓                      ↓
 Cancel           Record Payment
  (Cancelled)      (Pending/Partial/Paid)
```

### Status Definitions
- **Scheduled**: Appointment booked but not yet started
- **Ongoing**: Doctor is currently with patient
- **Completed**: Appointment finished, fees recorded, awaiting payment
- **Cancelled**: Appointment cancelled (cannot transition to other states)
- **Pending**: No payment received (initial state)
- **Partial**: Partial payment received
- **Paid**: Full payment received

---

## Features

### 1. Back Button
- Takes you back to admin dashboard
- Located at top of appointments page

### 2. Patient Details Modal
- Click any patient name to see full details
- Shows contact, address, appointment info
- Modal pops up, click X to close

### 3. Multiple Tabs
- Switch between appointment statuses easily
- Each tab shows count of appointments
- Scrollable for many appointments

### 4. Appointment Details
- Patient name (clickable for details)
- Doctor/Staff name
- Date and time
- Appointment type
- Fee amount
- Payment status
- Action buttons

### 5. Fee Management
- Doctors set fees when completing appointments
- Receptionists view fees on completed appointments
- Fees linked to appointment records

### 6. Payment Tracking
- Track payment status for each appointment
- Receptionists record payments
- Payment methods: Cash, Card, UPI, Cheque
- Support for partial payments

### 7. Prescription Linking
- Prescriptions linked to specific appointments
- Only available for completed appointments
- Doctors can view dispensing status

---

## Common Tasks

### Task: Schedule Follow-up Appointment
1. View patient's completed appointment
2. Click "Schedule Appointment"
3. Select same patient
4. Select doctor
5. Set new date/time
6. Select "follow-up" as type
7. Save

### Task: Collect Payment in Installments
1. First payment:
   - Record partial payment (e.g., $25 of $50)
   - Status becomes "Partial"
2. Second payment:
   - Record remaining $25
   - Status becomes "Paid"

### Task: Handle No-Show
1. Find scheduled appointment
2. Click Cancel
3. Change status note to "No-show"
4. Appointment cancelled, no fee charged

---

## Tips

- **Conflict Detection**: System prevents double-booking of doctors
- **Patient Names**: Always clickable to see full details
- **Fee Required**: You cannot complete appointment without setting fee
- **Role-Based**: Actions available based on your role
- **Real-time Updates**: Data refreshes after each action
- **Payment Methods**: Choose based on how patient pays (cash, card, UPI)
