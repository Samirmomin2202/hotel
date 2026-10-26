const User = require("../models/User");
const jwt = require("jsonwebtoken");

const jwt_secret = process.env.JWT_SECRET_KEY;
async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).send({ success: false, message: "Authentication required" });
        }
        const tokenData = jwt.verify(token, jwt_secret);
        const userId = tokenData?.userId;
        if (!userId) {
            return res.status(400).send({ success: false, message: "Invalid Token" });
        }
        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(400).send({ success: false, message: "Invalid Token" });
        }
        req.user = userData;
        next();
    }
    catch (err) {
        if (err?.name === "TokenExpiredError" || err?.name === "JsonWebTokenError") {
            return res.status(401).send({ success: false, message: "Authentication required" });
        }
        console.error("Unable to authenticate request", err);
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
}

module.exports = authMiddleware;
