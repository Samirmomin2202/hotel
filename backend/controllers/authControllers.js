const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Hotel = require("../models/Hotel");

//getting secret key from env file
const jwt_secret = process.env.JWT_SECRET_KEY || "secret";

async function register(req, res) {
    try {
        const { email, password, first_name, last_name = "", phone, date_of_birth } = req.body;
        if (!req.file) {
            return res.status(400).send({ success: false, message: "Profile image is required" });
        }
        const profile_picture_url = req.file.filename;
        if (!email || !password || !first_name || !phone || !date_of_birth) {
            return res.status(400).send({ success: false, message: "Incomplete Data" });
        }
        const isUserExists = await User.findOne({ email: email });
        if (isUserExists) {
            return res.status(400).send({ success: false, message: "User Already regsitered" });
        }
        // hashing password
        const hasedPassword = await bcrypt.hash(password, 10);
        const newUserData = new User({
            email,
            password: hasedPassword,
            first_name,
            last_name,
            phone,
            date_of_birth,
            profile_picture_url
        })
        await newUserData.save();
        res.status(201).send({ success: true, message: "User Registered SUccessfully" });
    }
    catch (err) {
        res.status(500).send({ success: false, message: "Internal Server Error", error: err.message });
    }

}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({ success: false, message: "Incomplete Data" });
        }
        const userData = await User.findOne({ email: email });
        if (!userData) {
            return res.status(404).send({ success: false, message: "Email Or Password Is Invalid" });
        }
        const isPasswordMatch = await bcrypt.compare(password, userData.password);
        if (!isPasswordMatch) {
            return res.status(404).send({ success: false, message: "Email Or Password Is Invalid" });
        }
        const token = jwt.sign({ userId: userData._id }, jwt_secret, { expiresIn: "7d" });
        const isProd = process.env.NODE_ENV === "production";

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: isProd ? "none" : "lax",
            secure: isProd,
            maxAge: 1000 * 60 * 60 * 24 * 2
        });

        res.status(200).send({
            success: true,
            message: "Login Successfully",
            data: {
                id: userData._id,
                name: userData.first_name + " " + userData.last_name,
                role: userData.role,
                phone: userData.phone,
                profile_picture_url: userData.profile_picture_url,
                date_of_birth: userData.date_of_birth
            }
        });

    }
    catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
}
function logout(req, res) {
    try {
        const isProd = process.env.NODE_ENV === "production";
        res.cookie("token", "", {
            httpOnly: true,
            sameSite: isProd ? "none" : "lax",
            secure: isProd,
            expires: new Date(0)
        });
        res.status(200).send({ success: true, message: "Logout Successfully" });
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: "Internal Server Error" })
    }
}
async function getMe(req, res) {
    try {
        const userData = req.user;
        let hotel;
        if (userData.role == "hotel-manager") {
            const hotelData = await Hotel.findOne({ created_by: userData._id });
            hotel = hotelData._id;
        }
        res.status(200).send({
            success: true,
            message: "Success",
            data: {
                id: userData._id,
                name: userData.first_name + " " + userData.last_name,
                role: userData.role,
                phone: userData.phone,
                profile_picture_url: userData.profile_picture_url,
                date_of_birth: userData.date_of_birth,
                hotel: hotel,
                email: userData.email
            }
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: "Internal Server Error" })
    }
}



module.exports = { register, login, logout, getMe };
//multer: Middleware to handle file uploads

// _id : 1  {userId: 1} ==> hjbsadbjsqssj
