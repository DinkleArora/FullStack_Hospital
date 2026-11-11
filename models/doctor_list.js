const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  did: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  hospital: { type: String },
});

module.exports = mongoose.model("Doctor", DoctorSchema);
