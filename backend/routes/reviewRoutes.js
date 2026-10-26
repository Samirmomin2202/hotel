const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { listPublicReviews, listMyReviews, createReview } = require("../controllers/reviewController");

const router = express.Router();
router.get("/mine", authMiddleware, listMyReviews);
router.get("/", listPublicReviews);
router.post("/", authMiddleware, createReview);

module.exports = router;
