const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const app = express();
const port = 8080;

app.use(session({ secret: "thisissecretkey123", resave: false, saveUninitialized: true, cookie: { secure: false } }));

const path = require("path");
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

main().then(() => console.log("DATABASE connection successful")).catch(err => console.log(err));
async function main() { await mongoose.connect("mongodb://127.0.0.1:27017/hospitaldb"); }

const Patient      = require("./models/patient_info.js");
const Admin        = require("./models/admin_info.js");
const Booking      = require("./models/booking_info.js");
const Doctor       = require("./models/doctor_list.js");
const LabTest      = require("./models/lab_test.js");
const LabBooking   = require("./models/lab_booking.js");
const Slot         = require("./models/slot.js");
const Bed          = require("./models/bed.js");
const Ambulance    = require("./models/ambulance.js");
const MedicalReport = require("./models/medical_report.js");
const BedRequest   = require("./models/bed_request.js");

app.listen(port, () => console.log("server working properly on port " + port));

// ─── HOME ────────────────────────────────────────────────────────────────────
app.get("/home", (req, res) => res.render("./homepages/index.ejs", { session: req.session || null }));
app.get("/about", (req, res) => res.render("./about.ejs", { session: req.session || null }));
app.get("/doctors", async (req, res) => {
  const doctors = await Doctor.find();
  res.render("./doctor.ejs", { doctors, session: req.session || null });
});

// ─── LOGIN GATE MIDDLEWARE ───────────────────────────────────────────────────
function requirePatient(req, res, next) {
  if (!req.session.user || req.session.user.role !== "patient") {
    return res.redirect("/login?msg=Please+register+or+login+to+continue");
  }
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") return res.redirect("/login");
  next();
}

// ─── BOOKING ─────────────────────────────────────────────────────────────────
app.get("/booking", (req, res) =>
  res.render("./homepages/booking.ejs", { msg: null, errorMsg: null, session: req.session || null })
);
app.get("/getDoctors/:hospital", async (req, res) => {
  try { res.json(await Doctor.find({ hospital: req.params.hospital })); }
  catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Return all doctors (for booking grid)
app.get("/getDoctorsAll", async (req, res) => {
  try { res.json(await Doctor.find()); }
  catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Get available slots for a doctor on a date
app.get("/getSlots", async (req, res) => {
  try {
    const { doctor, date } = req.query;
    if (!doctor || !date) return res.json([]);
    // Find doctor by name to get did
    const doc = await Doctor.findOne({ name: doctor });
    if (!doc) return res.json([]);
    // Find all slots for this doctor on this date
    const allSlots = await Slot.find({ did: doc.did, date });
    // Check which ones are already booked
    const bookedSlots = await Booking.find({ doctor, date });
    const bookedTimes = new Set(bookedSlots.map(b => b.time));
    const result = allSlots.map(s => ({
      _id: s._id,
      startTime: s.startTime,
      endTime: s.endTime,
      isBooked: !s.isAvailable || bookedTimes.has(s.startTime)
    }));
    res.json(result);
  } catch (err) { res.json([]); }
});

app.post("/booking", requirePatient, async (req, res) => {
  const { name, email, phone, hospital, doctor, department, date, time, slotId, reason } = req.body;
  try {
    if (await Booking.findOne({ doctor, date, time })) {
      return res.render("./homepages/booking.ejs", { msg: null, errorMsg: "This slot is already booked.", session: req.session || null });
    }
    await new Booking({ name, email, phone, hospital, doctor, department, date, time, slotId: slotId || null, reason }).save();
    // Mark slot as unavailable if slotId provided
    if (slotId) await Slot.findByIdAndUpdate(slotId, { isAvailable: false });
    res.render("./homepages/booking.ejs", { msg: "Appointment booked successfully!", errorMsg: null, session: req.session || null });
  } catch (error) {
    res.render("./homepages/booking.ejs", { msg: null, errorMsg: "Error booking appointment", session: req.session || null });
  }
});

// ─── LOGIN / SIGNUP / LOGOUT ─────────────────────────────────────────────────
app.get("/login", (req, res) => {
  const msg = req.query.msg || null;
  res.render("./login/loginpage.ejs", { errorMsg: msg });
});

app.post("/login", async (req, res) => {
  const { role, userId, password } = req.body;
  const redirect = req.query.redirect || null;
  try {
    if (role === "patient") {
      const user = await Patient.findOne({ patientId: userId });
      if (!user) return res.render("./login/loginpage.ejs", { errorMsg: "Patient not found" });
      if (user.password !== password) return res.render("./login/loginpage.ejs", { errorMsg: "Invalid Patient Credentials" });
      req.session.user = { id: user.patientId, name: user.patientName, role: "patient" };
      return res.redirect(redirect || "/home");
    }
    if (role === "admin") {
      const user = await Admin.findOne({ adminId: userId });
      if (!user) return res.render("./login/loginpage.ejs", { errorMsg: "Admin not found" });
      if (user.password !== password) return res.render("./login/loginpage.ejs", { errorMsg: "Invalid Admin Credentials" });
      req.session.user = { id: user.adminId, name: user.adminName, role: "admin" };
      return res.render("homepages/admin_index.ejs", { admin: user, session: req.session });
    }
    return res.render("./login/loginpage.ejs", { errorMsg: "Please select a role" });
  } catch (error) {
    return res.render("./login/loginpage.ejs", { errorMsg: "Server error, please try again" });
  }
});

app.get("/signup", (req, res) => res.render("./signup/signup.ejs", { errorMsg: null, successMsg: null }));

app.post("/signup", async (req, res) => {
  const { role, userId, userName, password } = req.body;
  try {
    if (role === "admin") {
      if (await Admin.findOne({ adminId: userId })) return res.render("signup/signup.ejs", { errorMsg: "Admin already exists!", successMsg: null });
      await Admin.create({ adminId: userId, adminName: userName, password });
      return res.render("signup/signup.ejs", { errorMsg: null, successMsg: "Admin registered! Please login." });
    }
    if (role === "patient") {
      if (await Patient.findOne({ patientId: userId })) return res.render("signup/signup.ejs", { errorMsg: "Patient already exists!", successMsg: null });
      await Patient.create({ patientId: userId, patientName: userName, password });
      return res.render("signup/signup.ejs", { errorMsg: null, successMsg: "Signup successful! Please login." });
    }
  } catch (err) {
    console.log(err);
    res.render("signup/signup.ejs", { errorMsg: "Server Error! Try again.", successMsg: null });
  }
});

app.get("/logout", (req, res) => req.session.destroy(() => res.redirect("/home")));

// ─── PATIENT DASHBOARD ────────────────────────────────────────────────────────
app.get("/patient/dashboard", requirePatient, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.session.user.id });
    const appointments = await Booking.find({ name: patient.patientName }).sort({ createdAt: -1 });
    const reports = await MedicalReport.find({ patientId: patient.patientId }).sort({ uploadedAt: -1 });
    const bedRequests = await BedRequest.find({ patientId: patient.patientId }).sort({ requestedAt: -1 });
    res.render("./user/patient-dashboard.ejs", { patient, appointments, reports, bedRequests, session: req.session, msg: null, errorMsg: null });
  } catch (err) { console.log(err); res.redirect("/home"); }
});

app.post("/patient/update-health", requirePatient, async (req, res) => {
  try {
    await Patient.findOneAndUpdate({ patientId: req.session.user.id }, { healthDetails: req.body.healthDetails });
    const patient = await Patient.findOne({ patientId: req.session.user.id });
    const appointments = await Booking.find({ name: patient.patientName }).sort({ createdAt: -1 });
    const reports = await MedicalReport.find({ patientId: patient.patientId }).sort({ uploadedAt: -1 });
    const bedRequests = await BedRequest.find({ patientId: patient.patientId }).sort({ requestedAt: -1 });
    res.render("./user/patient-dashboard.ejs", { patient, appointments, reports, bedRequests, session: req.session, msg: "Health details updated!", errorMsg: null });
  } catch (err) { res.redirect("/patient/dashboard"); }
});

// ─── BED BOOKING (Patient) ────────────────────────────────────────────────────
app.get("/patient/book-bed", requirePatient, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.session.user.id });
    const allBeds = await Bed.find();
    const bedStats = {
      general: allBeds.filter(b => b.bedType === "General" && !b.isOccupied).length,
      private: allBeds.filter(b => b.bedType === "Private" && !b.isOccupied).length,
      icu: allBeds.filter(b => b.bedType === "ICU" && !b.isOccupied).length
    };
    res.render("./user/book-bed.ejs", { patient, bedStats, msg: null, errorMsg: null, session: req.session });
  } catch (err) { res.redirect("/home"); }
});

app.post("/patient/book-bed", requirePatient, async (req, res) => {
  try {
    const { patientName, patientId, phone, wardType, preferredDate, reason } = req.body;
    if (!wardType) {
      const patient = await Patient.findOne({ patientId: req.session.user.id });
      const allBeds = await Bed.find();
      const bedStats = {
        general: allBeds.filter(b => b.bedType === "General" && !b.isOccupied).length,
        private: allBeds.filter(b => b.bedType === "Private" && !b.isOccupied).length,
        icu: allBeds.filter(b => b.bedType === "ICU" && !b.isOccupied).length
      };
      return res.render("./user/book-bed.ejs", { patient, bedStats, msg: null, errorMsg: "Please select a ward type.", session: req.session });
    }
    await BedRequest.create({ patientId, patientName, phone, wardType, preferredDate, reason });
    const patient = await Patient.findOne({ patientId: req.session.user.id });
    const allBeds = await Bed.find();
    const bedStats = {
      general: allBeds.filter(b => b.bedType === "General" && !b.isOccupied).length,
      private: allBeds.filter(b => b.bedType === "Private" && !b.isOccupied).length,
      icu: allBeds.filter(b => b.bedType === "ICU" && !b.isOccupied).length
    };
    res.render("./user/book-bed.ejs", { patient, bedStats, msg: "Bed request submitted! The hospital will confirm your bed assignment.", errorMsg: null, session: req.session });
  } catch (err) {
    console.log(err);
    res.redirect("/patient/book-bed");
  }
});

// ─── AMBULANCE (Patient) ──────────────────────────────────────────────────────
app.get("/patient/request-ambulance", requirePatient, (req, res) => {
  res.render("./user/request-ambulance.ejs", { session: req.session || null, msg: null, errorMsg: null });
});

app.post("/patient/request-ambulance", requirePatient, async (req, res) => {
  try {
    const { patientId, pickupAddress, phone } = req.body;
    const ambulance = await Ambulance.findOne({ isAvailable: true });
    if (!ambulance) {
      return res.render("./user/request-ambulance.ejs", {
        session: req.session || null, msg: null,
        errorMsg: "No ambulances available right now. Please call +91 108 directly."
      });
    }
    ambulance.isAvailable = false;
    ambulance.assignedPatientId = patientId;
    ambulance.currentLoc = pickupAddress;
    await ambulance.save();
    res.render("./user/request-ambulance.ejs", {
      session: req.session || null,
      msg: `Ambulance ${ambulance.vehicleNo} (Driver: ${ambulance.driverName}) has been dispatched to your location!`,
      errorMsg: null
    });
  } catch (err) {
    res.render("./user/request-ambulance.ejs", { session: req.session || null, msg: null, errorMsg: "Request failed. Please try again." });
  }
});

// ─── PATIENT MEDICAL REPORTS ──────────────────────────────────────────────────
app.get("/patient/reports", requirePatient, async (req, res) => {
  try {
    const reports = await MedicalReport.find({ patientId: req.session.user.id }).sort({ uploadedAt: -1 });
    res.render("./user/patient-reports.ejs", { reports, session: req.session });
  } catch (err) { res.redirect("/patient/dashboard"); }
});

// ─── ADMIN HOME ───────────────────────────────────────────────────────────────
app.get("/admin", (req, res) => res.render("homepages/admin_index.ejs", { admin: null, session: req.session }));

// ─── ADMIN BOOKINGS ───────────────────────────────────────────────────────────
app.get("/admin/manage-bookings", requireAdmin, async (req, res) => {
  try {
    const allBookings = await Booking.find().sort({ date: -1 });
    res.render("./homepages/admin_bookings.ejs", { bookings: allBookings, session: req.session });
  } catch (err) { res.status(500).send("Error retrieving bookings."); }
});

app.post("/admin/confirm-booking/:id", requireAdmin, async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.id, { status: "Confirmed" });
  res.redirect("/admin/manage-bookings");
});

app.post("/admin/cancel-booking/:id", requireAdmin, async (req, res) => {
  await Booking.findByIdAndUpdate(req.params.id, { status: "Cancelled" });
  res.redirect("/admin/manage-bookings");
});

// ─── ADMIN MEDICAL REPORTS ────────────────────────────────────────────────────
app.get("/admin/reports", requireAdmin, async (req, res) => {
  try {
    const reports = await MedicalReport.find().sort({ uploadedAt: -1 });
    res.render("./admin/medical-reports.ejs", { reports, msg: null, errorMsg: null, session: req.session });
  } catch (err) { res.redirect("/admin"); }
});

app.post("/admin/reports/add", requireAdmin, async (req, res) => {
  try {
    const { patientId, patientName, reportTitle, reportType, doctor, hospital, notes } = req.body;
    await MedicalReport.create({ patientId, patientName, reportTitle, reportType, doctor, hospital, notes });
    const reports = await MedicalReport.find().sort({ uploadedAt: -1 });
    res.render("./admin/medical-reports.ejs", { reports, msg: "Report added successfully!", errorMsg: null, session: req.session });
  } catch (err) {
    const reports = await MedicalReport.find().sort({ uploadedAt: -1 });
    res.render("./admin/medical-reports.ejs", { reports, msg: null, errorMsg: "Failed to add report.", session: req.session });
  }
});

app.post("/admin/reports/delete/:id", requireAdmin, async (req, res) => {
  await MedicalReport.findByIdAndDelete(req.params.id);
  res.redirect("/admin/reports");
});

// ─── ADMIN LAB TESTS ──────────────────────────────────────────────────────────
app.get("/admin/lab-tests", requireAdmin, async (req, res) => {
  const labTests = await LabTest.find();
  res.render("./admin/lab-tests.ejs", { labTests, msg: null, errorMsg: null, session: req.session || null });
});

app.post("/admin/lab-tests/add", requireAdmin, async (req, res) => {
  try {
    const { name, category, price, description } = req.body;
    await LabTest.create({ name, category, price, description });
    const labTests = await LabTest.find();
    res.render("./admin/lab-tests.ejs", { labTests, msg: "Lab Test Added!", errorMsg: null, session: req.session || null });
  } catch (err) {
    const labTests = await LabTest.find();
    res.render("admin/lab-tests", { labTests, msg: null, errorMsg: "Failed to add test.", session: req.session || null });
  }
});

app.get("/admin/lab-tests/delete/:id", requireAdmin, async (req, res) => {
  await LabTest.findByIdAndDelete(req.params.id);
  res.redirect("/admin/lab-tests");
});

app.get("/admin/lab-tests/edit/:id", requireAdmin, async (req, res) => {
  const test = await LabTest.findById(req.params.id);
  res.render("admin/edit-lab-test", { test, session: req.session || null });
});

app.post("/admin/lab-tests/update/:id", requireAdmin, async (req, res) => {
  const { name, category, price, description } = req.body;
  await LabTest.findByIdAndUpdate(req.params.id, { name, category, price, description });
  res.redirect("/admin/lab-tests");
});

// ─── ADMIN SLOTS ──────────────────────────────────────────────────────────────
app.get("/admin/slots", requireAdmin, async (req, res) => {
  try {
    const slots = await Slot.find().sort({ date: 1 });
    const doctors = await Doctor.find();
    res.render("./admin/slots.ejs", { slots, doctors, msg: null, errorMsg: null, session: req.session || null });
  } catch (err) { res.redirect("/admin"); }
});

app.post("/admin/slots/add", requireAdmin, async (req, res) => {
  try {
    const { slotId, did, date, startTime, endTime } = req.body;
    if (await Slot.findOne({ slotId })) {
      const slots = await Slot.find().sort({ date: 1 });
      const doctors = await Doctor.find();
      return res.render("./admin/slots.ejs", { slots, doctors, msg: null, errorMsg: "Slot ID already exists.", session: req.session || null });
    }
    await Slot.create({ slotId, did, date, startTime, endTime, isAvailable: true });
    const slots = await Slot.find().sort({ date: 1 });
    const doctors = await Doctor.find();
    res.render("./admin/slots.ejs", { slots, doctors, msg: "Slot added!", errorMsg: null, session: req.session || null });
  } catch (err) { console.log(err); res.redirect("/admin/slots"); }
});

app.post("/admin/slots/delete/:id", requireAdmin, async (req, res) => {
  await Slot.findByIdAndDelete(req.params.id);
  res.redirect("/admin/slots");
});

// ─── ADMIN BEDS ───────────────────────────────────────────────────────────────
app.get("/admin/beds", requireAdmin, async (req, res) => {
  try {
    const beds = await Bed.find();
    const bedRequests = await BedRequest.find().sort({ requestedAt: -1 });
    res.render("./admin/beds.ejs", { beds, bedRequests, msg: null, errorMsg: null, session: req.session || null });
  } catch (err) { res.redirect("/admin"); }
});

app.post("/admin/beds/add", requireAdmin, async (req, res) => {
  try {
    const { wardNo, bedType } = req.body;
    await Bed.create({ wardNo, bedType });
    const beds = await Bed.find();
    const bedRequests = await BedRequest.find().sort({ requestedAt: -1 });
    res.render("./admin/beds.ejs", { beds, bedRequests, msg: "Bed added!", errorMsg: null, session: req.session || null });
  } catch (err) {
    const beds = await Bed.find();
    const bedRequests = await BedRequest.find().sort({ requestedAt: -1 });
    res.render("./admin/beds.ejs", { beds, bedRequests, msg: null, errorMsg: "Failed to add bed.", session: req.session || null });
  }
});

app.post("/admin/beds/assign/:id", requireAdmin, async (req, res) => {
  try {
    const { patientId } = req.body;
    await Bed.findByIdAndUpdate(req.params.id, { isOccupied: true, patientId });
    await Patient.findOneAndUpdate({ patientId }, { bedId: req.params.id });
    res.redirect("/admin/beds");
  } catch (err) { res.redirect("/admin/beds"); }
});

app.post("/admin/beds/release/:id", requireAdmin, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (bed && bed.patientId) await Patient.findOneAndUpdate({ patientId: bed.patientId }, { bedId: null });
    await Bed.findByIdAndUpdate(req.params.id, { isOccupied: false, patientId: null });
    res.redirect("/admin/beds");
  } catch (err) { res.redirect("/admin/beds"); }
});

app.post("/admin/beds/delete/:id", requireAdmin, async (req, res) => {
  await Bed.findByIdAndDelete(req.params.id);
  res.redirect("/admin/beds");
});

// Approve / reject bed request
app.post("/admin/bed-requests/approve/:id", requireAdmin, async (req, res) => {
  await BedRequest.findByIdAndUpdate(req.params.id, { status: "Approved" });
  res.redirect("/admin/beds");
});

app.post("/admin/bed-requests/reject/:id", requireAdmin, async (req, res) => {
  await BedRequest.findByIdAndUpdate(req.params.id, { status: "Rejected" });
  res.redirect("/admin/beds");
});

// ─── ADMIN AMBULANCES ─────────────────────────────────────────────────────────
app.get("/admin/ambulances", requireAdmin, async (req, res) => {
  try {
    const ambulances = await Ambulance.find();
    res.render("./admin/ambulances.ejs", { ambulances, msg: null, errorMsg: null, session: req.session || null });
  } catch (err) { res.redirect("/admin"); }
});

app.post("/admin/ambulances/add", requireAdmin, async (req, res) => {
  try {
    const { vehicleNo, driverName, currentLoc } = req.body;
    await Ambulance.create({ vehicleNo, driverName, currentLoc: currentLoc || "Base Station" });
    const ambulances = await Ambulance.find();
    res.render("./admin/ambulances.ejs", { ambulances, msg: "Ambulance added!", errorMsg: null, session: req.session || null });
  } catch (err) {
    const ambulances = await Ambulance.find();
    res.render("./admin/ambulances.ejs", { ambulances, msg: null, errorMsg: "Failed. Vehicle No may already exist.", session: req.session || null });
  }
});

app.post("/admin/ambulances/dispatch/:id", requireAdmin, async (req, res) => {
  await Ambulance.findByIdAndUpdate(req.params.id, { isAvailable: false, assignedPatientId: req.body.patientId });
  res.redirect("/admin/ambulances");
});

app.post("/admin/ambulances/return/:id", requireAdmin, async (req, res) => {
  await Ambulance.findByIdAndUpdate(req.params.id, { isAvailable: true, assignedPatientId: null, currentLoc: "Base Station" });
  res.redirect("/admin/ambulances");
});

app.post("/admin/ambulances/delete/:id", requireAdmin, async (req, res) => {
  await Ambulance.findByIdAndDelete(req.params.id);
  res.redirect("/admin/ambulances");
});

// ─── USER LAB TESTS ───────────────────────────────────────────────────────────
app.get("/lab-tests", (req, res) => {
  if (!req.session.user) return res.redirect("/login?msg=Please+register+or+login+to+continue");
  LabTest.find().then(tests => res.render("./user/user-labtest.ejs", { tests, session: req.session || null }));
});

app.get("/lab-tests/book/:id", requirePatient, async (req, res) => {
  const test = await LabTest.findById(req.params.id);
  res.render("./user/book-lab-test.ejs", { test, msg: null, errorMsg: null, session: req.session || null });
});

app.post("/lab-tests/book/:id", requirePatient, async (req, res) => {
  try {
    const { patientName, email, phone, hospital, date, time, message } = req.body;
    const test = await LabTest.findById(req.params.id);
    await LabBooking.create({ patientName, email, phone, testName: test.name, hospital, date, time, message });
    res.render("./user/book-lab-test.ejs", { test, msg: "Test booked successfully!", errorMsg: null, session: req.session || null });
  } catch (err) {
    console.log(err);
    res.render("./user/book-lab-test.ejs", { test: null, msg: null, errorMsg: "Booking failed!", session: req.session || null });
  }
});
