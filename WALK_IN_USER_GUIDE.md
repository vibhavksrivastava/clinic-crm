# Walk-in Management System - User Guide

## Quick Start (For Receptionists & Doctors)

### 📍 Accessing Walk-in Management

1. Log in to the clinic system
2. Navigate to **Walk-ins** from the main menu
3. You'll see the Walk-in Management dashboard

---

## 🆕 Creating a New Walk-in

### Step-by-Step:

1. **Fill the Form (Left Side)**
   - **Patient Name** *(required)* - Enter full name
   - **Phone Number** *(required)* - Contact phone
   - **Address** *(required)* - Patient's address
   - **Notes** *(optional)* - Any additional remarks

2. **Click "Create Walk-in"** button
   - Patient will automatically be checked in
   - Check-in time is recorded automatically
   - Status starts as "Pending"

3. **Confirmation**
   - You'll see a success message
   - Walk-in appears in the tracking list
   - Form clears for next patient

### Example:
```
Name: John Smith
Phone: +1-555-0123
Address: 123 Main Street, City, State 12345
Notes: Complains of fever and cough
```

---

## 📋 Tracking Walk-ins

### The List (Right Side - "Tracking" Tab)

Each walk-in shows:
- **Patient Name & Phone** - Identification
- **Address** - Location info
- **Status Badge** - Current state (color-coded)
- **Check-in Time** - When they arrived
- **Duration** - How long they've been here (if completed)
- **Tests** - Additional tests recommended

### Status Colors:
- 🟡 **Yellow** = Pending (Just created)
- 🔵 **Blue** = In Progress (Started consultation)
- 🟢 **Green** = Completed (Finished)
- 🔴 **Red** = Cancelled

---

## 🎬 Managing Walk-in Status

### Starting a Walk-in (Receptionist/Doctor):
1. Find the walk-in in the list
2. Click **"Start"** button
3. Status changes to "In Progress"

### Completing a Walk-in:
1. After patient finishes consultation/tests
2. Click **"✓ Complete"** button
3. Check-out time is recorded automatically
4. Status changes to "Completed"
5. Duration is calculated and displayed

---

## 🧪 Adding Recommended Tests

### To Add a Test:

1. On the walk-in card, click **"🧪 Additional Tests"**
2. A form appears showing existing tests
3. Type test name in the "Add test..." field
4. Click **"Add"** button or press Enter
5. Test appears in the list with a ✓

### Common Tests:
- Blood Test
- X-Ray
- ECG
- Ultrasound
- Glucose Test
- Blood Pressure Check
- Oxygen Level
- COVID Test

### To Remove a Test:
1. Click the **"✕"** button next to the test
2. Test is removed instantly

---

## 🔍 Filtering Walk-ins

### By Status:
- Click status buttons at top: **"All"**, **"Pending"**, **"In Progress"**, **"Completed"**
- List updates instantly

### By Phone Number:
- Enter phone number in search box
- List filters as you type

### Example:
```
Search: "555-0123" → Shows only that patient's walk-ins
Filter: "Pending" → Shows only new walk-ins
```

---

## 📊 Viewing Reports

### Switch to Reports Tab:
1. Click **"📊 Reports"** tab
2. Choose report type:
   - **Daily** - Today's statistics
   - **Weekly** - This week's overview
   - **Monthly** - Month trends
   - **Yearly** - Year summary

### Daily Report Shows:
- ✓ Total walk-ins today
- ✓ How many completed
- ✓ Average time spent
- ✓ Most recommended tests

### Report Features:
- **Date Picker** - Select specific date (for daily reports)
- **Cards** - Summary statistics
- **Breakdown** - Daily/Weekly/Monthly details
- **Tests** - List of common tests

---

## 📈 Understanding Statistics

### Quick Stats (Top of Page):
- **Today** - Walk-ins seen today + completed count
- **This Week** - Total for the week
- **This Month** - Total for the month
- **Avg Duration** - Average time per patient

### Example Reading:
```
Today: 12 (10 completed)  → 12 patients today, 10 finished
This Week: 85             → 85 total this week
This Month: 342           → 342 total this month
Avg Duration: 25m         → Average 25 minutes per patient
```

---

## 💡 Best Practices

### For Receptionists:
1. ✓ Create walk-in as soon as patient arrives
2. ✓ Fill all required fields (Name, Phone, Address)
3. ✓ Add notes if patient has special requests
4. ✓ Don't create duplicates - check existing first

### For Doctors:
1. ✓ Mark walk-in as "In Progress" when consulting
2. ✓ Add recommended tests as you examine patient
3. ✓ Complete walk-in when finished
4. ✓ Add notes about patient's condition

### For Admin:
1. ✓ Review daily/weekly reports
2. ✓ Monitor busiest times
3. ✓ Identify trends in required tests
4. ✓ Plan staffing based on patterns

---

## ⏱️ Time Tracking Examples

### How Duration Works:

**Walk-in 1:**
- Check-in: 10:30 AM
- Check-out: 10:55 AM
- **Duration: 25 minutes**

**Walk-in 2:**
- Check-in: 11:00 AM
- Check-out: 11:35 AM
- **Duration: 35 minutes**

The system calculates this automatically!

---

## 🔔 Common Scenarios

### Scenario 1: Patient Arrives Without Appointment
1. Receptionist creates walk-in
2. Doctor reviews when ready
3. Marks as "In Progress" when consulting
4. Marks as "Complete" when done
5. Tests recorded in system

### Scenario 2: Patient Needs Multiple Tests
1. Doctor adds first test (e.g., Blood Test)
2. Patient goes for test
3. Doctor adds second test (e.g., X-Ray)
4. After all tests, mark complete

### Scenario 3: Patient Cancels/Doesn't Show
1. Admin can mark as "Cancelled"
2. Won't appear in active lists
3. Still visible in reports for analysis

---

## 🎯 Daily Workflow

### Morning (Start of Day):
1. Check Quick Stats
2. Review pending walk-ins
3. Start managing patients

### Throughout Day:
1. Create new walk-ins as patients arrive
2. Update status as consultations progress
3. Add tests as needed
4. Complete when patient leaves

### End of Day:
1. Review "Today" report
2. Check completion rate
3. Note peak times
4. Plan for tomorrow

---

## ❓ FAQ

**Q: What if I created the walk-in but patient didn't show up?**  
A: You can cancel it or just leave it incomplete. It won't affect your reports.

**Q: Can I edit patient information after creating walk-in?**  
A: Currently you can only edit notes. For other info, contact admin.

**Q: Are duplicate walk-ins possible?**  
A: Yes, so check the list before creating new ones.

**Q: How long does data stay in the system?**  
A: All data is kept for historical tracking and reporting.

**Q: Can I delete a walk-in?**  
A: Only admins can delete. Receptionists/Doctors see archived walk-ins.

**Q: What if the system is slow?**  
A: Try refreshing the page. Contact IT if issue persists.

**Q: Can I access from my phone?**  
A: Yes! The system is fully mobile-responsive.

---

## 🆘 Need Help?

### Common Issues:

**Walk-in not saving:**
- Check internet connection
- Verify all fields are filled
- Try refreshing the page

**Can't create walk-in:**
- Verify you're logged in
- Check if you have permission (receptionist/doctor/admin)
- Check network connection

**Reports not showing data:**
- Ensure walk-ins exist for that date
- Try selecting different date
- Check if you're viewing correct organization

**Form fields missing:**
- Clear browser cache
- Try different browser
- Contact IT support

---

## 📞 Support Contacts

- **IT Support:** [Contact Info]
- **System Admin:** [Contact Info]
- **Documentation:** See WALK_IN_SETUP_GUIDE.md

---

## 🎓 Training Tips

1. **Start with simpler tasks** - Create walk-in first
2. **Practice status updates** - Start/Complete a few
3. **Try reports** - View different time periods
4. **Add tests** - Get familiar with test feature
5. **Filter and search** - Use search functions

---

## ✨ Tips & Tricks

- 💡 Add comma-separated details in notes: "Fever, cough, mild rash"
- 💡 Use consistent phone format for easy searching
- 💡 Add test names exactly for better reporting
- 💡 Complete walk-in immediately after patient leaves
- 💡 Check pending count at a glance from dashboard

---

**Version:** 1.0  
**Last Updated:** May 2024  
**Status:** Active
