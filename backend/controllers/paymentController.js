const crypto = require("crypto");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const { credentialsForMode, currentMode, hasCredentials, publicSettings } = require("../services/paymentConfig");

async function getAdminPaymentSettings(req, res) {
    try {
        res.status(200).send({ success: true, data: await publicSettings() });
    } catch (err) {
        console.error("Unable to load payment settings", err);
        res.status(500).send({ success: false, message: "Unable to load payment settings." });
    }
}

async function handleRazorpayWebhook(req, res) {
    try {
        const body = req.body;
        const event = JSON.parse(body.toString("utf8"));
        const eventType = event?.event;
        const payment = event?.payload?.payment?.entity;
        if (!payment?.order_id || !["payment.captured", "order.paid"].includes(eventType)) {
            return res.status(200).send({ received: true });
        }

        const booking = await Booking.findOne({ razorpay_order_id: payment.order_id });
        if (!booking || !booking.payment_mode) return res.status(200).send({ received: true });
        const webhookSecret = process.env.RAZORPAY_TEST_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error(`Razorpay ${booking.payment_mode} webhook secret is missing.`);
            return res.status(500).send({ success: false });
        }

        const signature = req.get("x-razorpay-signature") || "";
        const received = /^[a-f0-9]{64}$/i.test(signature) ? Buffer.from(signature, "hex") : Buffer.alloc(0);
        const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest();
        if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
            return res.status(400).send({ success: false, message: "Invalid webhook signature." });
        }

        const expectedAmount = Math.round(Number(booking.final_amount) * 100);
        if (payment.amount === expectedAmount && payment.currency === "INR" && payment.status === "captured") {
            booking.payment_status = "success";
            booking.transaction_id = payment.id;
            if (["pending", "cancelled"].includes(booking.status)) booking.status = "confirmed";
            await booking.save();
        }
        res.status(200).send({ received: true });
    } catch (err) {
        console.error("Unable to process Razorpay webhook", err);
        res.status(400).send({ success: false });
    }
}

async function createRazorpayOrder(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send({ success: false, message: "Invalid booking ID." });
        }
        const booking = await Booking.findOne({ _id: req.params.id, user_id: req.user._id });
        if (!booking) return res.status(404).send({ success: false, message: "Booking not found." });
        if (booking.status !== "pending" || booking.payment_status !== "pending") {
            return res.status(409).send({ success: false, message: "This booking is no longer awaiting payment." });
        }

        const mode = await currentMode();
        const { keyId, keySecret } = credentialsForMode(mode);
        if (!keyId || !keySecret) {
            return res.status(503).send({ success: false, message: `Razorpay ${mode} mode is not configured. Contact the administrator.` });
        }

        let order;
        if (booking.razorpay_order_id) {
            const existingResponse = await fetch(`https://api.razorpay.com/v1/orders/${booking.razorpay_order_id}`, {
                headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` }
            });
            if (existingResponse.ok) order = await existingResponse.json();
        }
        if (!order) {
            const amount = Math.round(Number(booking.final_amount) * 100);
            if (!Number.isSafeInteger(amount) || amount < 100) {
                return res.status(400).send({ success: false, message: "The booking total is invalid for online payment." });
            }
            const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
                method: "POST",
                headers: {
                    Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    amount,
                    currency: "INR",
                    receipt: `booking_${booking._id}`,
                    notes: { booking_id: String(booking._id), user_id: String(req.user._id) }
                })
            });
            const result = await orderResponse.json();
            if (!orderResponse.ok) {
                console.error("Razorpay order creation failed", result?.error?.code || orderResponse.status);
                return res.status(502).send({ success: false, message: "Razorpay could not start the payment. Please try again." });
            }
            order = result;
        }

        const expectedAmount = Math.round(Number(booking.final_amount) * 100);
        if (order.amount !== expectedAmount || order.currency !== "INR") {
            return res.status(409).send({ success: false, message: "The payment order does not match this booking." });
        }
        booking.razorpay_order_id = order.id;
        booking.payment_mode = mode;
        booking.payment_method = "razorpay";
        await booking.save();
        res.status(200).send({
            success: true,
            data: { keyId, orderId: order.id, amount: order.amount, currency: order.currency, mode }
        });
    } catch (err) {
        console.error("Unable to create Razorpay order", err);
        res.status(502).send({ success: false, message: "Unable to connect to Razorpay. Please try again." });
    }
}

async function verifyRazorpayPayment(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send({ success: false, message: "Invalid booking ID." });
        }
        const { razorpay_payment_id: paymentId, razorpay_order_id: orderId, razorpay_signature: signature } = req.body || {};
        if (![paymentId, orderId, signature].every((value) => typeof value === "string" && value.length > 0)) {
            return res.status(400).send({ success: false, message: "Payment verification details are incomplete." });
        }
        const booking = await Booking.findOne({ _id: req.params.id, user_id: req.user._id });
        if (!booking) return res.status(404).send({ success: false, message: "Booking not found." });
        if (booking.payment_status === "success" && booking.transaction_id === paymentId) {
            return res.status(200).send({ success: true, message: "Payment already verified.", data: { bookingId: booking._id } });
        }
        if (booking.status !== "pending" || booking.razorpay_order_id !== orderId || !booking.payment_mode) {
            return res.status(409).send({ success: false, message: "Payment does not match an active booking." });
        }
        const { keyId, keySecret } = credentialsForMode(booking.payment_mode);
        if (!keyId || !keySecret) {
            return res.status(503).send({ success: false, message: "The payment configuration is unavailable." });
        }
        const expectedSignature = crypto.createHmac("sha256", keySecret).update(`${booking.razorpay_order_id}|${paymentId}`).digest();
        const receivedSignature = Buffer.from(signature, "hex");
        if (receivedSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(receivedSignature, expectedSignature)) {
            return res.status(400).send({ success: false, message: "Razorpay payment signature is invalid." });
        }

        const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
            headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` }
        });
        const payment = await paymentResponse.json();
        const expectedAmount = Math.round(Number(booking.final_amount) * 100);
        if (!paymentResponse.ok || payment.order_id !== booking.razorpay_order_id || payment.amount !== expectedAmount || payment.currency !== "INR" || payment.status !== "captured") {
            return res.status(409).send({ success: false, message: "Payment is not captured yet. If your account requires manual capture, capture it in Razorpay and try again." });
        }

        booking.payment_status = "success";
        booking.transaction_id = paymentId;
        booking.status = "confirmed";
        await booking.save();
        res.status(200).send({ success: true, message: "Payment verified.", data: { bookingId: booking._id } });
    } catch (err) {
        console.error("Unable to verify Razorpay payment", err);
        res.status(500).send({ success: false, message: "Unable to verify the payment. Contact support before retrying." });
    }
}

async function failRazorpayPayment(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send({ success: false, message: "Invalid booking ID." });
        }
        const booking = await Booking.findOne({ _id: req.params.id, user_id: req.user._id });
        if (!booking) return res.status(404).send({ success: false, message: "Booking not found." });
        if (booking.status === "pending" && booking.payment_status === "pending" && booking.razorpay_order_id) {
            booking.status = "cancelled";
            booking.payment_status = "failed";
            await booking.save();
        }
        res.status(200).send({ success: true });
    } catch (err) {
        console.error("Unable to update failed Razorpay payment", err);
        res.status(500).send({ success: false, message: "Unable to update the booking payment status." });
    }
}

module.exports = { getAdminPaymentSettings, createRazorpayOrder, verifyRazorpayPayment, failRazorpayPayment, handleRazorpayWebhook };
