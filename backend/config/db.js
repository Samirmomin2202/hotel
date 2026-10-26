const mongoose = require("mongoose");

const DB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/hotel-booking";

async function connectToDB() {
    try {
        await mongoose.connect(DB_URL);
        console.log("Connected To DB");
    }
    catch (err) {
        console.log(`Error In Connecting To DB, error: ${err}`);
    }
}

module.exports = connectToDB;