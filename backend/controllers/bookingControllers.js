const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const { currentMode, hasCredentials } = require("../services/paymentConfig");

function parseStayDates(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start < today || end <= start) {
        return null;
    }
    return { start, end, nights: Math.ceil((end - start) / (24 * 60 * 60 * 1000)) };
}

async function getAvailability(roomId, hotelId, checkIn, checkOut, guestCount) {
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return { error: "Choose a valid room.", status: 400 };
    }
    const stay = parseStayDates(checkIn, checkOut);
    if (!stay) return { error: "Choose valid future check-in and check-out dates.", status: 400 };

    const guests = Number(guestCount);
    if (!Number.isInteger(guests) || guests < 1) {
        return { error: "The number of guests must be at least one.", status: 400 };
    }

    const room = await Room.findById(roomId).lean();
    if (!room) return { error: "Room not found.", status: 404 };
    if (hotelId && String(room.hotel_id) !== String(hotelId)) {
        return { error: "The selected room does not belong to this hotel.", status: 400 };
    }
    if (guests > Number(room.capacity || 0)) {
        return { error: `This room allows up to ${room.capacity} guests.`, status: 400 };
    }

    const hotel = await Hotel.findById(room.hotel_id).select("is_active").lean();
    if (!hotel || hotel.is_active === false) return { error: "This hotel is not accepting bookings.", status: 404 };

    const pendingCutoff = new Date(Date.now() - 15 * 60 * 1000);
    const occupied = await Booking.countDocuments({
        room_id: room._id,
        status: { $in: ["pending", "confirmed"] },
        check_in_date: { $lt: stay.end },
        check_out_date: { $gt: stay.start },
        $or: [
            { status: "confirmed" },
            { status: "pending", payment_method: "pay-at-hotel" },
            { status: "pending", payment_method: "razorpay", payment_status: "pending", createdAt: { $gt: pendingCutoff } }
        ]
    });
    const roomsLeft = Number(room.total_rooms || 0) - occupied;
    if (roomsLeft < 1) return { error: "This room is no longer available for those dates.", status: 409 };

    return { room, stay, guests, roomsLeft };
}

async function getUserBookings(req, res) {
    try {
        if (String(req.params.userId) !== String(req.user._id) && req.user.role !== "admin") {
            return res.status(403).send({ success: false, message: "You can only view your own bookings." });
        }
        const allBookings = await Booking.find({ user_id: req.params.userId }).select("-card_details")
            .populate("hotel_id")
            .populate("room_id")
            .sort({ createdAt: -1 });
        res.status(200).send({ success: true, data: allBookings });
    } catch (err) {
        console.error("Unable to load user bookings", err);
        res.status(500).send({ success: false, message: "Unable to load bookings." });
    }
}

async function getBookingDetails(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send({ success: false, message: "Invalid booking ID." });
        }
        const booking = await Booking.findById(req.params.id).select("-card_details").populate("hotel_id").populate("room_id");
        if (!booking) return res.status(404).send({ success: false, message: "Booking not found." });
        if (req.user.role !== "admin" && String(booking.user_id) !== String(req.user._id)) {
            return res.status(403).send({ success: false, message: "You can only view your own bookings." });
        }
        res.status(200).send({ success: true, data: booking });
    } catch (err) {
        console.error("Unable to load booking details", err);
        res.status(500).send({ success: false, message: "Unable to load booking." });
    }
}

async function checkAvailability(req, res) {
    try {
        const result = await getAvailability(
            req.body?.roomId,
            req.body?.hotelId,
            req.body?.checkIn,
            req.body?.checkOut,
            req.body?.number_of_guests
        );
        if (result.error) return res.status(result.status).send({ success: false, message: result.error, isAvailable: false });
        const nightlyRate = Number(result.room.base_price);
        if (!Number.isFinite(nightlyRate) || nightlyRate < 0) {
            return res.status(400).send({ success: false, message: "This room does not have a valid rate.", isAvailable: false });
        }
        const subtotal = Number((nightlyRate * result.stay.nights).toFixed(2));
        const taxAmount = Number((subtotal * 0.18).toFixed(2));
        res.status(200).send({
            success: true,
            isAvailable: true,
            roomsLeft: result.roomsLeft,
            quote: {
                nightly_rate: nightlyRate,
                nights: result.stay.nights,
                subtotal,
                tax_amount: taxAmount,
                final_amount: Number((subtotal + taxAmount).toFixed(2)),
                currency: "INR"
            }
        });
    } catch (err) {
        console.error("Unable to check room availability", err);
        res.status(500).send({ success: false, message: "Unable to check availability." });
    }
}

async function createBooking(req, res) {
    let bookingRequestId;
    try {
        const { room_id: roomId, hotel_id: hotelId, check_in_date: checkIn, check_out_date: checkOut, number_of_guests: guestCount, expected_final_amount: expectedFinalAmount } = req.body || {};
        bookingRequestId = req.body?.booking_request_id;
        if (bookingRequestId !== undefined && (typeof bookingRequestId !== "string" || bookingRequestId.length < 8 || bookingRequestId.length > 100)) {
            return res.status(400).send({ success: false, message: "Invalid booking request identifier." });
        }
        if (bookingRequestId) {
            const existing = await Booking.findOne({ user_id: req.user._id, chat_request_id: bookingRequestId });
            if (existing) {
                const sameRequest = String(existing.room_id) === String(roomId)
                    && String(existing.hotel_id) === String(hotelId)
                    && new Date(existing.check_in_date).getTime() === new Date(checkIn).getTime()
                    && new Date(existing.check_out_date).getTime() === new Date(checkOut).getTime()
                    && Number(existing.number_of_guests) === Number(guestCount);
                if (!sameRequest) return res.status(409).send({ success: false, message: "This booking confirmation was already used for a different stay." });
                await existing.populate("hotel_id", "name address city");
                await existing.populate("room_id", "name base_price");
                return res.status(200).send({ success: true, message: "Existing booking returned for this confirmation.", data: existing });
            }
        }
        const paymentMode = await currentMode();
        if (!hasCredentials(paymentMode)) {
            return res.status(503).send({ success: false, message: `Razorpay ${paymentMode} mode is not configured. Ask the administrator to add the server keys.` });
        }
        const result = await getAvailability(roomId, hotelId, checkIn, checkOut, guestCount);
        if (result.error) return res.status(result.status).send({ success: false, message: result.error });

        const nightlyRate = Number(result.room.base_price);
        if (!Number.isFinite(nightlyRate) || nightlyRate < 0) {
            return res.status(400).send({ success: false, message: "This room does not have a valid rate." });
        }
        const totalAmount = Number((nightlyRate * result.stay.nights).toFixed(2));
        const taxAmount = Number((totalAmount * 0.18).toFixed(2));
        const finalAmount = Number((totalAmount + taxAmount).toFixed(2));
        if (expectedFinalAmount !== undefined && Number(expectedFinalAmount) !== finalAmount) {
            return res.status(409).send({
                success: false,
                code: "PRICE_CHANGED",
                message: "The price changed since your summary. Please review the updated total before confirming.",
                quote: {
                    nightly_rate: nightlyRate,
                    nights: result.stay.nights,
                    subtotal: totalAmount,
                    tax_amount: taxAmount,
                    final_amount: finalAmount,
                    currency: "INR"
                }
            });
        }
        const booking = await Booking.create({
            user_id: req.user._id,
            hotel_id: result.room.hotel_id,
            room_id: result.room._id,
            check_in_date: result.stay.start,
            check_out_date: result.stay.end,
            number_of_guests: result.guests,
            total_amount: totalAmount,
            tax_amount: taxAmount,
            final_amount: finalAmount,
            status: "pending",
            payment_status: "pending",
            payment_method: "razorpay",
            ...(bookingRequestId ? { chat_request_id: bookingRequestId } : {}),
            special_requests: String(req.body?.special_requests || "").trim().slice(0, 500),
            alternate_phone_number: req.body?.alternate_phone_number ? Number(req.body.alternate_phone_number) : undefined
        });
        await booking.populate("hotel_id", "name address city");
        await booking.populate("room_id", "name base_price");
        res.status(201).send({ success: true, message: "Booking saved successfully.", data: booking });
    } catch (err) {
        if (err?.code === 11000 && bookingRequestId) {
            const existing = await Booking.findOne({ user_id: req.user._id, chat_request_id: bookingRequestId });
            if (existing) {
                await existing.populate("hotel_id", "name address city");
                await existing.populate("room_id", "name base_price");
                return res.status(200).send({ success: true, message: "Existing booking returned for this confirmation.", data: existing });
            }
        }
        console.error("Unable to create booking", err);
        res.status(500).send({ success: false, message: "Unable to save booking. Please try again." });
    }
}

async function cancelBooking(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send({ success: false, message: "Invalid booking ID." });
        }
        const booking = await Booking.findOne({ _id: req.params.id, user_id: req.user._id }).select("-card_details");
        if (!booking) return res.status(404).send({ success: false, message: "Booking not found." });
        if (!["pending", "confirmed"].includes(booking.status)) {
            return res.status(409).send({ success: false, message: "This booking can no longer be cancelled." });
        }
        booking.status = "cancelled";
        await booking.save();
        res.status(200).send({ success: true, message: "Booking cancelled successfully." });
    } catch (err) {
        console.error("Unable to cancel booking", err);
        res.status(500).send({ success: false, message: "Unable to cancel booking." });
    }
}

async function updateBooking(req, res) {
    try {
        const { status } = req.body || {};
        if (!mongoose.Types.ObjectId.isValid(req.params.id) || !["pending", "confirmed", "cancelled", "completed"].includes(status)) {
            return res.status(400).send({ success: false, message: "Invalid booking status." });
        }
        const booking = await Booking.findById(req.params.id).select("-card_details").populate("hotel_id", "created_by");
        if (!booking) return res.status(404).send({ success: false, message: "Booking not found." });
        if (req.user.role !== "admin" && String(booking.hotel_id?.created_by) !== String(req.user._id)) {
            return res.status(403).send({ success: false, message: "You can only update bookings for your hotel." });
        }
        booking.status = status;
        await booking.save();
        res.status(200).send({ success: true, message: "Booking updated successfully." });
    } catch (err) {
        console.error("Unable to update booking", err);
        res.status(500).send({ success: false, message: "Unable to update booking." });
    }
}

async function getHotelBookings(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.hotelId)) {
            return res.status(400).send({ success: false, message: "Invalid hotel ID." });
        }
        const hotel = await Hotel.findById(req.params.hotelId).select("created_by");
        if (!hotel) return res.status(404).send({ success: false, message: "Hotel not found." });
        if (req.user.role !== "admin" && String(hotel.created_by) !== String(req.user._id)) {
            return res.status(403).send({ success: false, message: "You can only view bookings for your hotel." });
        }
        const hotelBookings = await Booking.find({ hotel_id: hotel._id }).select("-card_details")
            .populate("user_id", "first_name last_name email phone")
            .populate("room_id")
            .sort({ createdAt: -1 });
        res.status(200).send({ success: true, data: hotelBookings });
    } catch (err) {
        console.error("Unable to load hotel bookings", err);
        res.status(500).send({ success: false, message: "Unable to load hotel bookings." });
    }
}

module.exports = {
    getUserBookings, getBookingDetails, checkAvailability, createBooking,
    cancelBooking, updateBooking, getHotelBookings
};
