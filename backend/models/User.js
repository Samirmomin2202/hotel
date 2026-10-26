const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
    email: { type: String, unique: true, lower: true, required: true },
    password: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: String,
    phone: { type: Number, minlength: 10, maxlength: 10, required: true },
    date_of_birth: { type: Date },
    profile_picture_url: { type: String, default: "" },
    role: { type: String, enum: ["customer", "admin", "hotel-manager"], default: "customer" }
}, { timestamps: true });
const User = mongoose.model("users", userSchema);
module.exports = User;