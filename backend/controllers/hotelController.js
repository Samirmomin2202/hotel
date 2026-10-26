const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const User = require("../models/User");
const mongoose = require("mongoose");
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
async function registerHotel(req, res) {
    try {
        const data = req.body;
        const images = req.files.map((file) => file.filename);
        if (typeof data.policies == "string") {
            data.policies = JSON.parse(data.policies);
        }
        const userData = req.user;
        const newHotel = new Hotel({
            ...data, images: images, created_by: userData._id,star_rating: 3
        })
        await newHotel.save();
        await User.findByIdAndUpdate(userData._id, { role: "hotel-manager" });
        res.status(201).send({ success: true, message: "Hotel Registered Successfully" });
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
}
async function updateHotel(req, res) {
    try {
        const hotelId = req.params.id;
        const data = req.body;
        const existingImages = Array.isArray(req.body?.existingImages) ? req.body.existingImages : [];
        const newImages = req?.files?.map((file) => file.filename);
        if(!(typeof data.star_rating == "number")){
            data.star_rating = 3;
        }
        // console.log(data)
        const images = [...existingImages, ...newImages];
        if (typeof data.policies == "string") {
            data.policies = JSON.parse(data.policies);
        }
        const oldHotel = await Hotel.findById(hotelId);
        if (!oldHotel) {
            res.status(404).send({ success: false, message: "Hotel Not Found" });
        }
        const newHotel = await Hotel.findByIdAndUpdate(hotelId, { ...data, images: images });
        res.status(201).send({ success: true, message: "Hotel Updated Successfully" });
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
}
/* 
Query Format
destination: "array",    // city
  checkIn: "Date",         // YYYY-MM-DD
  checkOut: "Date",        // YYYY-MM-DD
  guests: "number",
  minPrice: "number",
  maxPrice: "number",
  rating: "number",        // 1-5
  page: "number",
  limit: "number",
  category: "array"
*/
async function getAllHotels(req, res) {
    try {
        const { destination, checkIn, checkOut, guests, minPrice = 0, maxPrice = Number.MAX_SAFE_INTEGER, rating, page = 1, limit = 6, category, hotelname } = req.query;
        const query = { is_active: { $ne: false } };
        const numericMinPrice = Number(minPrice);
        const numericMaxPrice = Number(maxPrice);
        const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
        const pageLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 6));
        if (hotelname) {
            const searchText = String(hotelname).trim();
            query.$or = [
                { name: { $regex: searchText, $options: "i" } },
                { city: { $regex: searchText, $options: "i" } },
                { address: { $regex: searchText, $options: "i" } }
            ];
        }
        if (destination) {
            const filterCity = Array.isArray(destination) ? destination : [destination];
            query.city = { $in: filterCity.map((city) => new RegExp(`^${escapeRegex(city)}$`, "i")) };
        }
        if (category) {
            const filterCategory = Array.isArray(category) ? category : [category];
            query.category = { $in: filterCategory.map((value) => new RegExp(`^${escapeRegex(value)}$`, "i")) };
        }
        if (rating) {
            const filterRating = Number(rating);
            if (Number.isFinite(filterRating)) query.star_rating = { $gte: filterRating };
        }
        query.price = {
            $gte: Number.isFinite(numericMinPrice) ? numericMinPrice : 0,
            $lte: Number.isFinite(numericMaxPrice) ? numericMaxPrice : Number.MAX_SAFE_INTEGER
        };
        const filterOptionsPromise = Promise.all([
            Hotel.distinct("city", { is_active: { $ne: false }, city: { $nin: [null, ""] } }),
            Hotel.distinct("category", { is_active: { $ne: false }, category: { $nin: [null, ""] } })
        ]).then(([cities, categories]) => ({
            cities: cities.sort((a, b) => a.localeCompare(b)),
            categories: categories.sort((a, b) => a.localeCompare(b))
        }));
        if (!(checkIn && checkOut && guests)) {
            const start = (pageNumber - 1) * pageLimit;
            const [allHotels, totalHotels, filters] = await Promise.all([
                Hotel.find(query).skip(start).limit(pageLimit).lean(),
                Hotel.countDocuments(query),
                filterOptionsPromise
            ]);
            return res.status(200).send({
                success: true,
                message: "Success",
                data: {
                    hotels: allHotels,
                    pagination: {
                        page: pageNumber,
                        limit: pageLimit,
                        total: totalHotels,
                        totalPages: Math.ceil(totalHotels / pageLimit)
                    },
                    filters
                }
            })
        }

        const allHotels = await Hotel.find(query).lean();
        const ans = [];
        for (let hotel of allHotels) {
            const rooms = await Room.find({
                hotel_id: hotel._id,
                capacity: { $gte: guests }
            }).lean();
            for (let room of rooms) {
                const allBooking = await Booking.countDocuments({
                    room_id: room._id,
                    check_in_date: { $lt: new Date(checkOut) },
                    check_out_date: { $gt: new Date(checkIn) },
                    status: { $in: ["pending", "confirmed"] }
                })
                const availableRooms = room.total_rooms - allBooking;
                if (availableRooms > 0) {
                    ans.push(hotel);
                    break;
                }
            }
        }
        const start = (pageNumber - 1) * pageLimit;
        const end = start + pageLimit;
        const totalHotels = ans.length;
        const filteredHotels = ans.slice(start, end);
        const filters = await filterOptionsPromise;
        res.status(200).send({
            success: true, message: "Success", data: {
                hotels: filteredHotels,
                pagination: {
                    page: pageNumber,
                    limit: pageLimit,
                    total: totalHotels,
                    totalPages: Math.ceil(totalHotels / pageLimit)
                },
                filters
            }
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
}

async function getHotel(req, res) {
    try {
        const hotelId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).send({ success: false, message: "Invalid hotel ID" });
        }
        const hotelData = await Hotel.findById(hotelId).lean();
        if (!hotelData || hotelData.is_active === false) {
            return res.status(404).send({ success: false, message: "Hotel Not Found" });
        }
        const allRooms = await Room.find({ hotel_id: hotelId });
        res.status(200).send({ success: true, message: "Success", data: { ...hotelData, rooms: allRooms } });
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
}

async function getUserHotel(req, res) {
    try {
        const userId = req.params.userId;
        console.log(userId)
        const hotelData = await Hotel.findOne({ created_by: userId });
        if (!hotelData) {
            return res.status(400).send({ success: false, message: "No Hotel Found" });
        }
        res.status(200).send({ success: true, message: "Success", data: hotelData })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
}
module.exports = { registerHotel, updateHotel, getAllHotels, getHotel, getUserHotel }
