const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Review = require("../models/Review");

async function listPublicReviews(req, res) {
    try {
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .limit(12)
            .populate("user_id", "first_name last_name")
            .populate("hotel_id", "name city")
            .lean();
        const data = reviews.map((review) => ({
            _id: review._id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            guestName: review.user_id?.last_name
                ? `${review.user_id.first_name} ${review.user_id.last_name[0]}.`
                : review.user_id?.first_name || "Guest",
            hotelName: review.hotel_id?.name || "Hotel",
            city: review.hotel_id?.city || ""
        }));
        res.status(200).send({ success: true, data });
    } catch (err) {
        console.error("Unable to load guest reviews", err);
        res.status(500).send({ success: false, message: "Unable to load reviews." });
    }
}

async function listMyReviews(req, res) {
    try {
        const reviews = await Review.find({ user_id: req.user._id }).select("booking_id").lean();
        res.status(200).send({ success: true, data: reviews.map((review) => String(review.booking_id)) });
    } catch (err) {
        console.error("Unable to load the customer's review status", err);
        res.status(500).send({ success: false, message: "Unable to load your review status." });
    }
}

async function createReview(req, res) {
    try {
        const bookingId = String(req.body?.booking_id || "");
        const rating = Number(req.body?.rating);
        const comment = String(req.body?.comment || "").trim();
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).send({ success: false, message: "Choose a valid booking." });
        }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).send({ success: false, message: "Choose a rating from 1 to 5 stars." });
        }
        if (comment.length < 10 || comment.length > 1000) {
            return res.status(400).send({ success: false, message: "Write a review between 10 and 1,000 characters." });
        }

        const booking = await Booking.findOne({ _id: bookingId, user_id: req.user._id })
            .select("hotel_id status payment_status")
            .lean();
        if (!booking) return res.status(404).send({ success: false, message: "Booking not found on your account." });
        if (booking.status !== "completed" || booking.payment_status !== "success") {
            return res.status(403).send({ success: false, message: "Reviews are available after a completed, paid stay." });
        }

        const review = await Review.create({
            user_id: req.user._id,
            hotel_id: booking.hotel_id,
            booking_id: booking._id,
            rating,
            comment
        });
        res.status(201).send({ success: true, message: "Review submitted successfully.", data: { _id: review._id } });
    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).send({ success: false, message: "You have already reviewed this booking." });
        }
        if (err?.name === "ValidationError") {
            return res.status(400).send({ success: false, message: "Check your rating and review text, then try again." });
        }
        console.error("Unable to save guest review", err);
        res.status(500).send({ success: false, message: "Unable to save your review." });
    }
}

module.exports = { listPublicReviews, listMyReviews, createReview };
