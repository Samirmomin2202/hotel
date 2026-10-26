const express = require("express");
const { register, login, logout, getMe } = require("../controllers/authControllers");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();
const upload = require("../config/upload");
router.post("/register", upload.single("profile_picture_url"), register)
router.post("/login", login)
router.post("/logout", logout)
router.get("/me", authMiddleware, getMe)
module.exports = router;