const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  patientName: { type: String, required: true },
  password: { type: String, required: true },
  healthDetails: { type: String, default: "" },
  bedId: { type: String, default: null },
});

module.exports = mongoose.model("Patient", patientSchema);
