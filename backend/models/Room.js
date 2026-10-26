const mongoose = require("mongoose");
/* 
{
  id: "UUID",
  hotel_id: "UUID", // references Hotel.id

  name: "string", // Deluxe Room, Premium Suite
  description: "string",
  base_price: "number",
  total_rooms: "number", // Total inventory count
  capacity: "number",
  size_sqft: "number",

  bed_type: "Object", // {King: number, Queen: number, Twin: number}
  image: "string",

  created_at: "Timestamp",
  updated_at: "Timestamp"
}
*/

const roomSchema = mongoose.Schema({
    hotel_id: { type: mongoose.Schema.Types.ObjectId, ref: "hotels" },
    name: String,
    description: String,
    base_price: Number,
    total_rooms: Number,
    capacity: Number,
    size_sqft: Number,
    bed_type: { type: { King: Number, Queen: Number, Twin: Number } },
    image: String
}, { timestamps: true });

const roomModel = mongoose.model("rooms",roomSchema);
module.exports = roomModel