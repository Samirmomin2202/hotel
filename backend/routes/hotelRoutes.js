const express = require("express");
const { registerHotel, updateHotel, getAllHotels, getHotel, getUserHotel } = require("../controllers/hotelController");
const authMiddleware = require("../middlewares/authMiddleware");
const checkOwnerMiddleware = require("../middlewares/checkOwnerMiddleware");
const upload = require("../config/upload");
const router = express.Router();
router.post("/hotel", authMiddleware, upload.array("images"), registerHotel);

router.put("/hotel/:id", authMiddleware, checkOwnerMiddleware, upload.array("images"), updateHotel);
router.get("/hotels", getAllHotels);
router.get("/hotel/:id", getHotel);
router.get("/user/:userId",getUserHotel)
module.exports = router;