# Jeevan Raksha – Hospital Management System

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Make sure MongoDB is running locally on port 27017.

3. Seed the database with doctors and slots (run once):
   ```
   node seed.js
   ```

4. Start the server:
   ```
   node app.js
   ```

5. Visit: http://localhost:8080/home

---

## What's New (v2)

### Patient Features
- **Appointment Booking** — Doctor cards shown in a grid, each displaying available time slots as clickable chips. Filter by hospital, department, and date.
- **Lab Test Booking** — Hospital selector cards + full time slot grid (07:00 AM – 07:00 PM) with visual feedback.
- **Book a Bed** — Visual ward-type selector (General / Private / ICU) with live availability counts.
- **Request Ambulance** — Dispatches nearest available unit.
- **Medical Reports** — View all uploaded lab reports, X-rays, prescriptions, and discharge summaries.
- **Login Required** — All booking features require registration/login.

### Admin Features
- **Medical Reports** — Upload reports per patient (name, ID, type, doctor, hospital, notes). Delete entries.
- **Bed Requests** — Approve or reject patient bed requests.
- Full CRUD for bookings, lab tests, slots, beds, ambulances.

### Pre-seeded Doctors (after running seed.js)
| ID   | Name             | Specialization   | Hospital                |
|------|------------------|------------------|-------------------------|
| D001 | Dr. Priya Sharma | Cardiology       | City Hospital           |
| D002 | Dr. Rahul Mehta  | Neurology        | Sunrise Medical Center  |
| D003 | Dr. Anita Verma  | Gynecology       | Apollo Clinic           |
| D004 | Dr. Suresh Kumar | Orthopedics      | City Hospital           |
| D005 | Dr. Neha Gupta   | Dermatology      | Sunrise Medical Center  |
| D006 | Dr. Vikram Singh | General Medicine | Apollo Clinic           |

Each doctor has 10 slots/day for 7 days (4 slots on Sundays).
