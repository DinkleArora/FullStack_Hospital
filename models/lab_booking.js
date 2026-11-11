const mongoose = require("mongoose");

const labBookingSchema = new mongoose.Schema({
    patientName: String,
    email: String,
    phone: String,
    testName: String,
    date: String,
    time: String,
    message: String
});

module.exports = mongoose.model("LabBooking", labBookingSchema);
