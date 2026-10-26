const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const User = require("../models/User");
const Room = require("../models/Room");
const Review = require("../models/Review");
const mongoose = require("mongoose");

async function getOverview(req, res) {
    try {
        const [users, hotels, bookings, revenue] = await Promise.all([
            User.countDocuments(),
            Hotel.countDocuments(),
            Booking.countDocuments(),
            Booking.aggregate([
                { $match: { status: { $ne: "cancelled" } } },
                { $group: { _id: null, total: { $sum: "$final_amount" } } }
            ])
        ]);
        res.status(200).send({
            success: true,
            data: { users, hotels, bookings, revenue: revenue[0]?.total || 0 }
        });
    } catch (err) {
        console.error("Unable to load admin overview", err);
        res.status(500).send({ success: false, message: "Unable to load dashboard" });
    }
}

async function getUsers(req, res) {
    try {
        const users = await User.find()
            .select("first_name last_name email role createdAt")
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).send({ success: true, data: users });
    } catch (err) {
        console.error("Unable to load admin users", err);
        res.status(500).send({ success: false, message: "Unable to load users" });
    }
}

async function updateUserRole(req, res) {
    try {
        const { role } = req.body;
        const validRoles = ["customer", "hotel-manager", "admin"];
        if (!validRoles.includes(role)) {
            return res.status(400).send({ success: false, message: "Invalid role" });
        }
        if (String(req.user._id) === req.params.id && role !== "admin") {
            return res.status(400).send({ success: false, message: "You cannot remove your own admin access" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" });
        }
        const safeUser = user.toObject();
        delete safeUser.password;
        res.status(200).send({ success: true, data: safeUser });
    } catch (err) {
        console.error("Unable to update user role", err);
        res.status(500).send({ success: false, message: "Unable to update user role" });
    }
}

async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({ success: false, message: "Invalid user account." });
        }
        if (String(req.user._id) === id) {
            return res.status(400).send({ success: false, message: "You cannot delete the account you are currently using." });
        }

        const user = await User.findById(id).select("_id").lean();
        if (!user) return res.status(404).send({ success: false, message: "User not found." });

        // Retain financial booking history, remove the deleted user's public
        // reviews, and leave their hotel listings in place without an owner link.
        await Promise.all([
            Booking.updateMany({ user_id: user._id }, { $unset: { user_id: "" } }),
            Review.deleteMany({ user_id: user._id }),
            Hotel.updateMany({ created_by: user._id }, { $unset: { created_by: "" } })
        ]);
        await User.deleteOne({ _id: user._id });
        return res.status(200).send({ success: true, message: "User account deleted." });
    } catch (err) {
        console.error("Unable to delete user account", err);
        return res.status(500).send({ success: false, message: "Unable to delete user account." });
    }
}

async function getHotels(req, res) {
    try {
        const hotels = await Hotel.find()
            .populate("created_by", "first_name last_name email")
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).send({ success: true, data: hotels });
    } catch (err) {
        console.error("Unable to load admin hotels", err);
        res.status(500).send({ success: false, message: "Unable to load hotels" });
    }
}

function normalizeHotelPayload(body = {}) {
    const amenitiesInput = body.amenities;
    let amenities = {};
    if (amenitiesInput && typeof amenitiesInput === "object" && !Array.isArray(amenitiesInput)) {
        amenities = amenitiesInput;
    } else {
        const names = Array.isArray(amenitiesInput)
            ? amenitiesInput
            : String(amenitiesInput || "").split(",");
        amenities = Object.fromEntries(names.map((name) => [String(name).trim().toLowerCase(), true]).filter(([name]) => name));
    }

    let policies = body.policies || {};
    if (typeof policies === "string") {
        try { policies = JSON.parse(policies); } catch { policies = {}; }
    }

    const imagesInput = body.images;
    const images = Array.isArray(imagesInput)
        ? imagesInput.map((image) => String(image).trim()).filter(Boolean)
        : String(imagesInput || "").split(/\r?\n|,/).map((image) => image.trim()).filter(Boolean);

    return {
        name: String(body.name || "").trim(),
        description: String(body.description || "").trim(),
        address: String(body.address || "").trim(),
        city: String(body.city || "").trim(),
        state: String(body.state || "").trim(),
        country: String(body.country || "").trim(),
        zip_code: String(body.zip_code || "").trim(),
        category: String(body.category || "budget").trim(),
        star_rating: Number(body.star_rating || 3),
        images,
        amenities,
        is_active: body.is_active !== false && body.is_active !== "false",
        price: Number(body.price || 0),
        contact_email: String(body.contact_email || "").trim(),
        contact_phone: String(body.contact_phone || "").trim(),
        check_in_time: String(body.check_in_time || "").trim(),
        check_out_time: String(body.check_out_time || "").trim(),
        policies: {
            cancellation: String(policies.cancellation || ""),
            pets: policies.pets === true || policies.pets === "true"
        }
    };
}

function validHotel(hotel) {
    return hotel.name && hotel.city && hotel.country && hotel.price >= 0 &&
        Number.isFinite(hotel.price) && Number.isFinite(hotel.star_rating) &&
        hotel.star_rating >= 1 && hotel.star_rating <= 5;
}

async function createHotel(req, res) {
    try {
        const hotelData = normalizeHotelPayload(req.body);
        if (!validHotel(hotelData)) {
            return res.status(400).send({ success: false, message: "Hotel name, city, country, a valid price, and a 1–5 star rating are required." });
        }
        const hotel = await Hotel.create(hotelData);
        res.status(201).send({ success: true, data: hotel });
    } catch (err) {
        console.error("Unable to create admin hotel", err);
        res.status(500).send({ success: false, message: "Unable to create hotel" });
    }
}

async function updateHotel(req, res) {
    try {
        const hotelData = normalizeHotelPayload(req.body);
        if (!validHotel(hotelData)) {
            return res.status(400).send({ success: false, message: "Hotel name, city, country, a valid price, and a 1–5 star rating are required." });
        }
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, hotelData, {
            new: true,
            runValidators: true
        }).populate("created_by", "first_name last_name email").lean();
        if (!hotel) return res.status(404).send({ success: false, message: "Hotel not found" });
        res.status(200).send({ success: true, data: hotel });
    } catch (err) {
        console.error("Unable to update admin hotel", err);
        res.status(500).send({ success: false, message: "Unable to update hotel" });
    }
}

async function deleteHotel(req, res) {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) return res.status(404).send({ success: false, message: "Hotel not found" });
        const rooms = await Room.find({ hotel_id: hotel._id }).select("_id").lean();
        const roomIds = rooms.map((room) => room._id);
        const bookingCount = await Booking.countDocuments({
            $or: [{ hotel_id: hotel._id }, { room_id: { $in: roomIds } }]
        });
        if (bookingCount > 0) {
            return res.status(409).send({ success: false, message: "This hotel has bookings. Deactivate it to keep booking history." });
        }
        await Room.deleteMany({ hotel_id: hotel._id });
        await Hotel.findByIdAndDelete(hotel._id);
        res.status(200).send({ success: true, message: "Hotel deleted" });
    } catch (err) {
        console.error("Unable to delete admin hotel", err);
        res.status(500).send({ success: false, message: "Unable to delete hotel" });
    }
}

async function getBookings(req, res) {
    try {
        const bookings = await Booking.find().select("-card_details")
            .populate("user_id", "first_name last_name email")
            .populate("hotel_id", "name city")
            .populate("room_id", "name")
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).send({ success: true, data: bookings });
    } catch (err) {
        console.error("Unable to load admin bookings", err);
        res.status(500).send({ success: false, message: "Unable to load bookings" });
    }
}

async function updateBooking(req, res) {
    try {
        const { status, payment_status: paymentStatus } = req.body || {};
        const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
        const validPaymentStatuses = ["pending", "success", "failed", "refunded"];
        const updates = {};

        if (status !== undefined) {
            if (!validStatuses.includes(status)) {
                return res.status(400).send({ success: false, message: "Invalid booking status" });
            }
            updates.status = status;
        }
        if (paymentStatus !== undefined) {
            if (!validPaymentStatuses.includes(paymentStatus)) {
                return res.status(400).send({ success: false, message: "Invalid payment status" });
            }
            updates.payment_status = paymentStatus;
        }
        if (!Object.keys(updates).length) {
            return res.status(400).send({ success: false, message: "Provide a booking or payment status" });
        }

        const booking = await Booking.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        }).select("-card_details")
            .populate("user_id", "first_name last_name email")
            .populate("hotel_id", "name city")
            .lean();
        if (!booking) return res.status(404).send({ success: false, message: "Booking not found" });
        res.status(200).send({ success: true, data: booking });
    } catch (err) {
        console.error("Unable to update admin booking", err);
        res.status(500).send({ success: false, message: "Unable to update booking" });
    }
}

module.exports = { getOverview, getUsers, updateUserRole, deleteUser, getHotels, createHotel, updateHotel, deleteHotel, getBookings, updateBooking };
