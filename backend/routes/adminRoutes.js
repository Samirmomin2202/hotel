const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const checkAdminMiddleware = require("../middlewares/checkAdminMiddleware");
const { getOverview, getUsers, updateUserRole, deleteUser, getHotels, createHotel, updateHotel, deleteHotel, getBookings, updateBooking } = require("../controllers/adminController");
const { listKnowledge, createKnowledge, updateKnowledge, deleteKnowledge } = require("../controllers/knowledgeController");
const { getAdminPaymentSettings } = require("../controllers/paymentController");
const { getRagStatus } = require("../controllers/chatbotController");

const router = express.Router();
router.use(authMiddleware, checkAdminMiddleware);
router.get("/overview", getOverview);
router.get("/users", getUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.get("/hotels", getHotels);
router.post("/hotels", createHotel);
router.put("/hotels/:id", updateHotel);
router.delete("/hotels/:id", deleteHotel);
router.get("/bookings", getBookings);
router.patch("/bookings/:id", updateBooking);
router.get("/payment-settings", getAdminPaymentSettings);
router.get("/chatbot/status", getRagStatus);
router.get("/chatbot/knowledge", listKnowledge);
router.post("/chatbot/knowledge", createKnowledge);
router.put("/chatbot/knowledge/:id", updateKnowledge);
router.delete("/chatbot/knowledge/:id", deleteKnowledge);

module.exports = router;
