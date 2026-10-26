const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const User = require("../models/User");

function isAdminDataRequest(message) {
    const text = String(message || "").toLowerCase();
    const asksForData = /\b(show|list|give|provide|tell|what|how many|how much|total|totla|count|number|amount|summary|overview|report|read|fetch|display|see|revenue|earnings|price|cost|value)\b/i.test(text);
    const asksForPdf = /\b(pdf|document|uploaded file|resume)\b/i.test(text);
    if (!asksForData || (asksForPdf && !/\b(admin\s+dashboard|dashboard|admin panel|admin database|admin data)\b/i.test(text))) return false;
    const asksAdminDashboard = /\b(admin\s+dashboard|dashboard|admin panel|admin database|admin data|platform data|all records)\b/i.test(text);
    const shortFollowUp = /^(total|totals|overall|amount|value|price|cost|summary|overview|dashboard|data|all)[?.!\s]*$/i.test(text);
    const asksForAdminEntity = /\b(users?|accounts?|hotels?|bookings?|reservations?|payments?|revenue|earnings|income|sales|statistics|stats)\b/i.test(text);
    const namesAdminData = /\badmin\b/i.test(text) && /\b(database|data|records?)\b/i.test(text);
    return shortFollowUp || asksAdminDashboard || asksForAdminEntity || namesAdminData;
}

function currency(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function bookingLabel(booking, index) {
    const guest = booking.user_id
        ? [booking.user_id.first_name, booking.user_id.last_name].filter(Boolean).join(" ") || booking.user_id.email
        : "Guest account unavailable";
    const hotel = booking.hotel_id?.name || "Hotel unavailable";
    const city = booking.hotel_id?.city ? `, ${booking.hotel_id.city}` : "";
    const room = booking.room_id?.name || "Room unavailable";
    const checkIn = booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString("en-IN", { timeZone: "UTC" }) : "not set";
    const checkOut = booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString("en-IN", { timeZone: "UTC" }) : "not set";
    return `${index + 1}. ${guest} — ${hotel}${city}, ${room}; ${checkIn} to ${checkOut}; ${booking.number_of_guests || 0} guest(s); ${currency(booking.final_amount)}; booking ${booking.status || "pending"}; payment ${booking.payment_status || "pending"}.`;
}

async function getAdminDashboardReport(message) {
    const text = String(message || "");
    const asksUsers = /\b(users?|accounts?)\b/i.test(text);
    const asksHotels = /\bhotels?\b/i.test(text);
    const asksBookings = /\b(bookings?|reservations?)\b/i.test(text);
    const asksPayments = /\b(payments?|revenue|earnings|income|sales|booking value)\b/i.test(text);
    const asksForList = /\b(show|list|give|provide|tell|fetch|display|see|which|who|all|recent)\b/i.test(text);
    const asksForTotal = /\b(total|totla|overall|combined|sum|how much|amount|value|price|cost)\b/i.test(text);

    if (!asksForTotal && asksUsers && asksForList) {
        const users = await User.find().select("first_name last_name email role createdAt").sort({ createdAt: -1 }).limit(25).lean();
        const lines = users.map((user, index) => `${index + 1}. ${[user.first_name, user.last_name].filter(Boolean).join(" ") || "Name unavailable"} — ${user.email} — ${user.role}.`);
        return `Hotel platform users (${users.length}${users.length === 25 ? ", latest 25" : ""})\n\n${lines.join("\n") || "No users found."}`;
    }
    if (!asksForTotal && asksHotels && asksForList) {
        const hotels = await Hotel.find().select("name city state star_rating price is_active").sort({ createdAt: -1 }).limit(25).lean();
        const lines = hotels.map((hotel, index) => `${index + 1}. ${hotel.name || "Unnamed hotel"} — ${[hotel.city, hotel.state].filter(Boolean).join(", ") || "Location unavailable"}; ${hotel.star_rating || "unrated"} stars; ${currency(hotel.price)} starting price; ${hotel.is_active === false ? "inactive" : "active"}.`);
        return `Hotels (${hotels.length}${hotels.length === 25 ? ", latest 25" : ""})\n\n${lines.join("\n") || "No hotels found."}`;
    }
    if (!asksForTotal && (asksBookings || asksPayments) && asksForList) {
        const bookings = await Booking.find().select("-card_details -transaction_id -razorpay_order_id")
            .populate("user_id", "first_name last_name email")
            .populate("hotel_id", "name city")
            .populate("room_id", "name")
            .sort({ createdAt: -1 }).limit(20).lean();
        const lines = bookings.map(bookingLabel);
        const heading = asksPayments && !asksBookings ? "Recent booking payments" : "Recent bookings";
        return `${heading} (${bookings.length}${bookings.length === 20 ? ", latest 20" : ""})\n\n${lines.join("\n") || "No bookings found."}`;
    }

    const [totalUsers, totalHotels, bookings, payments] = await Promise.all([
        User.countDocuments(),
        Hotel.countDocuments(),
        Booking.aggregate([
            { $group: {
                _id: null,
                total: { $sum: 1 },
                bookingValue: { $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, { $ifNull: ["$final_amount", 0] }, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } }
            } }
        ]),
        Booking.aggregate([
            { $group: { _id: "$payment_status", count: { $sum: 1 }, amount: { $sum: { $ifNull: ["$final_amount", 0] } } } }
        ])
    ]);
    const totals = bookings[0] || { total: 0, bookingValue: 0, cancelled: 0 };
    const byStatus = Object.fromEntries(payments.map((item) => [item._id || "not recorded", item]));
    const totalBookingValueLine = `Total booking value (cancelled bookings excluded, matching the dashboard): ${currency(totals.bookingValue)}`;
    const summary = ["Live hotel admin dashboard overview"];
    if (asksForTotal && (asksBookings || asksPayments || /\b(price|cost|value)\b/i.test(text))) {
        summary.push(totalBookingValueLine);
        summary.push(`Bookings counted: ${Math.max(0, totals.total - totals.cancelled)} of ${totals.total}; cancelled: ${totals.cancelled}.`);
    }
    summary.push(
        `- Registered users: ${totalUsers}`,
        `- Hotels: ${totalHotels}`,
        `- Total bookings: ${totals.total}`,
        ...(!summary.includes(totalBookingValueLine) ? [`- ${totalBookingValueLine}`] : []),
        `- Cancelled bookings: ${totals.cancelled}`,
        `- Successful payments: ${byStatus.success?.count || 0} (${currency(byStatus.success?.amount || 0)})`,
        `- Pending payments: ${byStatus.pending?.count || 0}`,
        `- Failed payments: ${byStatus.failed?.count || 0}`,
        `- Refunded payments: ${byStatus.refunded?.count || 0} (${currency(byStatus.refunded?.amount || 0)})`,
        "",
        "These values are read from the live hotel database. Ask for users, hotels, bookings, or payments to see the latest records."
    );
    return summary.join("\n");
}

function isAdminAccessQuestion(message) {
    const text = String(message || "");
    const mentionsAdminChat = /\b(admin|administrator|dashboard|control panel)\b/i.test(text) && /\b(chat|access|logged|login|account|role|session|preview|can|could|is this|works?)\b/i.test(text);
    return mentionsAdminChat;
}

module.exports = { isAdminDataRequest, getAdminDashboardReport, isAdminAccessQuestion };