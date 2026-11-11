const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  appId: { type: String },
  name: String,
  email: String,
  phone: String,
  hospital: String,
  department: String,
  doctor: String,
  did: String,
  date: String,
  time: String,
  slotId: { type: String, default: null },
  reason: String,
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled'],
    default: 'Pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", appointmentSchema);
