const mongoose = require("mongoose");

const bedRequestSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  phone: { type: String, required: true },
  wardType: { type: String, required: true }, // General, ICU, Private
  preferredDate: { type: String, required: true },
  reason: { type: String, default: "" },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  assignedBedId: { type: String, default: null },
  requestedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BedRequest", bedRequestSchema);
