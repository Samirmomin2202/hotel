const mongoose = require("mongoose");
/* 
  id: "UUID",
  name: "string",
  description: "string",
  address: "string",
  city: "string",
  state: "string",
  country: "string",
  category:"string", //resort, luxury, cottage, 5-star, budget
  star_rating: "number", // 1-5
  images: "string[]", 
  contact_email: "string",
  contact_phone: "string",
  check_in_time: "string",
  check_out_time: "string",
  price,

  policies: "Object", // {cancellation:"string",pets:boolean}

  created_by: "UUID", // References User.id
*/
const hotelSchema = mongoose.Schema({
    name: String,
    description: String,
    address: String,
    state: String,
    city: String,
    country: String,
    zip_code: String,
    category: String,
    star_rating: { type: Number, default: 3 },
    images: Array,
    amenities: { type: mongoose.Schema.Types.Mixed, default: {} },
    is_active: { type: Boolean, default: true },
    is_demo: { type: Boolean, default: false },
    price: Number,
    contact_email: String,
    contact_phone: String,
    check_in_time: String,
    check_out_time: String,
    policies: { type: { cancellation: String, pets: Boolean } },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "users" }
}, { timestamps: true })

const hotelModel = mongoose.model("hotels", hotelSchema);
module.exports = hotelModel;
