const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    hotel_id: { type: mongoose.Schema.Types.ObjectId, ref: "hotels", required: true },
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "bookings", required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);
