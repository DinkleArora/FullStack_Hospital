const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  slotId: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  did: { type: String, required: true }, // doctor ID
});

module.exports = mongoose.model("Slot", slotSchema);
