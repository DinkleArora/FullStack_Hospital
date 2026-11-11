/**
 * seed.js — Run once to populate doctors and slots
 * Usage: node seed.js
 */
const mongoose = require("mongoose");
const Doctor = require("./models/doctor_list.js");
const Slot   = require("./models/slot.js");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/hospitaldb");
  console.log("Connected to MongoDB");

  // ── Doctors ──────────────────────────────────────────────
  const doctors = [
    { did: "D001", name: "Priya Sharma",   specialization: "Cardiology",      hospital: "City Hospital" },
    { did: "D002", name: "Rahul Mehta",    specialization: "Neurology",       hospital: "Sunrise Medical Center" },
    { did: "D003", name: "Anita Verma",    specialization: "Gynecology",      hospital: "Apollo Clinic" },
    { did: "D004", name: "Suresh Kumar",   specialization: "Orthopedics",     hospital: "City Hospital" },
    { did: "D005", name: "Neha Gupta",     specialization: "Dermatology",     hospital: "Sunrise Medical Center" },
    { did: "D006", name: "Vikram Singh",   specialization: "General Medicine", hospital: "Apollo Clinic" },
  ];

  for (const d of doctors) {
    await Doctor.updateOne({ did: d.did }, d, { upsert: true });
    console.log(`✓ Doctor: Dr. ${d.name}`);
  }

  // ── Slots — generate for next 7 days ──────────────────────
  const times = [
    { start: "09:00", end: "09:30" },
    { start: "09:30", end: "10:00" },
    { start: "10:00", end: "10:30" },
    { start: "10:30", end: "11:00" },
    { start: "11:00", end: "11:30" },
    { start: "14:00", end: "14:30" },
    { start: "14:30", end: "15:00" },
    { start: "15:00", end: "15:30" },
    { start: "15:30", end: "16:00" },
    { start: "16:00", end: "16:30" },
  ];

  let slotCounter = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay(); // 0 = Sunday

    for (const doc of doctors) {
      // Fewer slots on weekends
      const dayTimes = dayOfWeek === 0 ? times.slice(0, 4) : times;
      for (const t of dayTimes) {
        const slotId = `S${String(slotCounter).padStart(4, "0")}`;
        await Slot.updateOne(
          { did: doc.did, date: dateStr, startTime: t.start },
          { $setOnInsert: { slotId, did: doc.did, date: dateStr, startTime: t.start, endTime: t.end, isAvailable: true } },
          { upsert: true }
        );
        slotCounter++;
      }
    }
    console.log(`✓ Slots for ${dateStr}`);
  }

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
