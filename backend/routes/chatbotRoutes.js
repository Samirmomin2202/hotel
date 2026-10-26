const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { replyToMessage } = require("../controllers/chatbotController");

const router = express.Router();
router.post("/message", authMiddleware, replyToMessage);

module.exports = router;
