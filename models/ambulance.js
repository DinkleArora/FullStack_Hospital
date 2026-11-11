const mongoose = require("mongoose");

const ambulanceSchema = new mongoose.Schema({
  vehicleNo: { type: String, required: true, unique: true },
  driverName: { type: String, required: true },
  currentLoc: { type: String, default: "Base Station" },
  isAvailable: { type: Boolean, default: true },
  assignedPatientId: { type: String, default: null },
});

module.exports = mongoose.model("Ambulance", ambulanceSchema);
