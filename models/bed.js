const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema({
  wardNo: { type: String, required: true },
  bedType: { type: String, required: true }, // e.g. General, ICU, Private
  isOccupied: { type: Boolean, default: false },
  patientId: { type: String, default: null }, // assigned patient
});

module.exports = mongoose.model("Bed", bedSchema);
