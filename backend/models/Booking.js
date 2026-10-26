const mongoose = require("mongoose");
/* 
id: "UUID",
  user_id: "UUID", //ref users table 
  hotel_id: "UUID", //ref hotels table
  room_id: "UUID", //ref rooms table

  check_in_date: "Date",
  check_out_date: "Date",
  number_of_guests: "number",

  total_amount: "number",
  tax_amount: "number",
  final_amount: "number",
  status: "string", // booked, confirmed, cancelled, completed
  payment_status: "string", // pending, success, failed, refunded
  payment_method: "string", // upi, debit_card, credit_card, cash
  transaction_id: "string",
  // Online payment details are not collected by this demo checkout.
  special_requests: "string",
  cancellation_reason: "string",
  cancelled_at: "Timestamp",
  alternate_phone_number: "number" 
  created_at: "Timestamp",
  updated_at: "Timestamp"
*/
const bookingSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    hotel_id: { type: mongoose.Schema.Types.ObjectId, ref: "hotels" },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "rooms" },
    check_in_date: { type: Date },
    check_out_date: Date,
    number_of_guests: Number,
    total_amount: Number,
    tax_amount: Number,
    final_amount: Number,
    status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default:"pending" },
    payment_status: { type: String, enum: ["pending", "success", "failed", "refunded"] },
    payment_method: String,
    transaction_id: String,
    razorpay_order_id: String,
    chat_request_id: { type: String, maxlength: 100 },
    payment_mode: { type: String, enum: ["test", "live"] },
    special_requests: String,
    cancellation_reason: { type: String, default: "" },
    alternate_phone_number: Number
}, { timestamps: true })

bookingSchema.index({ room_id: 1, status: 1, check_in_date: 1, check_out_date: 1 });
bookingSchema.index({ user_id: 1, chat_request_id: 1 }, {
    unique: true,
    partialFilterExpression: { chat_request_id: { $type: "string" } }
});

const bookingModel = mongoose.model("bookings", bookingSchema);
module.exports = bookingModel;
