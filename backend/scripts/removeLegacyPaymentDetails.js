require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

async function removeLegacyPaymentDetails() {
    if (!process.env.MONGODB_URL) throw new Error("MONGODB_URL is missing from backend/.env");
    await mongoose.connect(process.env.MONGODB_URL);
    const result = await Booking.collection.updateMany(
        { card_details: { $exists: true } },
        { $unset: { card_details: "" } }
    );
    console.log(`Removed stored card fields from ${result.modifiedCount} booking record(s).`);
}

removeLegacyPaymentDetails()
    .catch((err) => {
        console.error("Unable to clean legacy payment fields:", err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
