const mongoose = require("mongoose");

const medicalReportSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  reportTitle: { type: String, required: true },
  reportType: { type: String, enum: ["Lab Report", "X-Ray", "Prescription", "Discharge Summary", "Other"], default: "Lab Report" },
  hospital: { type: String, default: "" },
  doctor: { type: String, default: "" },
  fileData: { type: String, default: "" }, // base64 or URL placeholder
  notes: { type: String, default: "" },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("MedicalReport", medicalReportSchema);
