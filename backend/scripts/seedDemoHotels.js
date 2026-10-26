require("dotenv").config();
const mongoose = require("mongoose");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");

const demoHotels = [
    {
        name: "Royal Heritage Palace", city: "Jaipur", state: "Rajasthan", country: "India", zip_code: "302001",
        address: "Amer Road, Jaipur", category: "luxury", star_rating: 5, price: 4299,
        description: "A heritage stay with courtyard dining, hand-painted interiors, and views of the old city.",
        contact_email: "hello@royalheritage.example", contact_phone: "+91 9845123712", check_in_time: "13:00", check_out_time: "11:00",
        images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=85"],
        amenities: { wifi: true, pool: true, ac: true, restaurant: true, spa: true },
        policies: { cancellation: "Free cancellation up to 24 hours before check-in.", pets: false },
        rooms: [{ name: "Heritage Deluxe", base_price: 3200 }, { name: "Courtyard Suite", base_price: 5600 }]
    },
    {
        name: "Mountain View Retreat", city: "Manali", state: "Himachal Pradesh", country: "India", zip_code: "175103",
        address: "Old Manali Road, Manali", category: "resort", star_rating: 4, price: 3850,
        description: "A quiet mountain escape with pine forest trails and balconies facing the Himalayas.",
        contact_email: "stay@mountainretreat.example", contact_phone: "+91 9874561200", check_in_time: "12:00", check_out_time: "10:00",
        images: ["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1400&q=85"],
        amenities: { wifi: true, ac: true, restaurant: true, parking: true },
        policies: { cancellation: "Free cancellation up to 48 hours before check-in.", pets: true },
        rooms: [{ name: "Snowline Room", base_price: 3200 }, { name: "Himalayan Suite", base_price: 5100 }]
    },
    {
        name: "The Grand Orchid", city: "Mumbai", state: "Maharashtra", country: "India", zip_code: "400020",
        address: "Marine Drive, Mumbai", category: "5-star", star_rating: 5, price: 6100,
        description: "A polished city hotel with sea views, rooftop dining, and a calm pool deck.",
        contact_email: "reservations@grandorchid.example", contact_phone: "+91 9898989876", check_in_time: "15:00", check_out_time: "12:00",
        images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=85"],
        amenities: { wifi: true, pool: true, ac: true, restaurant: true, spa: true },
        policies: { cancellation: "Partial refund is available up to 48 hours before check-in.", pets: false },
        rooms: [{ name: "City View Room", base_price: 5800 }, { name: "Sea Facing Suite", base_price: 8900 }]
    },
    {
        name: "Lake View Residency", city: "Udaipur", state: "Rajasthan", country: "India", zip_code: "313001",
        address: "Fateh Sagar Lake, Udaipur", category: "resort", star_rating: 5, price: 7200,
        description: "Lake-facing rooms, garden paths, and easy access to boat tours around Fateh Sagar.",
        contact_email: "hello@lakeview.example", contact_phone: "+91 9988776655", check_in_time: "14:00", check_out_time: "11:00",
        images: ["https://images.unsplash.com/photo-1551887374-9a13c6c72c8d?auto=format&fit=crop&w=1400&q=85"],
        amenities: { wifi: true, pool: true, ac: true, restaurant: true, spa: true },
        policies: { cancellation: "Free cancellation up to 48 hours before check-in.", pets: true },
        rooms: [{ name: "Lake View Room", base_price: 6500 }, { name: "Garden Suite", base_price: 9500 }]
    },
    {
        name: "City Comfort Inn", city: "New Delhi", state: "Delhi", country: "India", zip_code: "110001",
        address: "Connaught Place, New Delhi", category: "budget", star_rating: 3, price: 2999,
        description: "A practical central stay for travelers who want quick access to shops, dining, and transit.",
        contact_email: "frontdesk@citycomfort.example", contact_phone: "+91 9876300123", check_in_time: "13:00", check_out_time: "11:00",
        images: ["https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=85"],
        amenities: { wifi: true, ac: true, restaurant: true, parking: true },
        policies: { cancellation: "Refund available after a 10% cancellation fee.", pets: false },
        rooms: [{ name: "Standard Room", base_price: 2100 }, { name: "Family Room", base_price: 3500 }]
    },
    {
        name: "Coastal Palm House", city: "Kochi", state: "Kerala", country: "India", zip_code: "682001",
        address: "Fort Kochi, Kochi", category: "cottage", star_rating: 4, price: 4600,
        description: "A relaxed coastal hideaway with shaded verandas and the cafés of Fort Kochi nearby.",
        contact_email: "welcome@coastalpalm.example", contact_phone: "+91 9895002468", check_in_time: "14:00", check_out_time: "11:00",
        images: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=85"],
        amenities: { wifi: true, ac: true, restaurant: true, garden: true },
        policies: { cancellation: "Free cancellation up to 24 hours before check-in.", pets: true },
        rooms: [{ name: "Palm Courtyard Room", base_price: 3900 }, { name: "Sea Breeze Suite", base_price: 6200 }]
    }
];

async function seedDemoHotels() {
    if (!process.env.MONGODB_URL) throw new Error("MONGODB_URL is missing from backend/.env");
    await mongoose.connect(process.env.MONGODB_URL);
    for (const { rooms, ...hotelData } of demoHotels) {
        const hotel = await Hotel.findOneAndUpdate(
            { name: hotelData.name, city: hotelData.city, is_demo: true },
            { $set: { ...hotelData, is_demo: true, is_active: true } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        for (const room of rooms) {
            await Room.findOneAndUpdate(
                { hotel_id: hotel._id, name: room.name },
                { $set: {
                    hotel_id: hotel._id,
                    name: room.name,
                    description: `${room.name} with thoughtful essentials and a comfortable sitting area.`,
                    base_price: room.base_price,
                    total_rooms: 4,
                    capacity: room.name.toLowerCase().includes("family") ? 4 : 2,
                    size_sqft: 340,
                    bed_type: { King: 1, Queen: 0, Twin: 0 },
                    image: hotelData.images[0]
                } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }
        console.log(`Added demo listing: ${hotel.name}, ${hotel.city}`);
    }
}

seedDemoHotels()
    .catch((err) => {
        console.error("Unable to seed demo hotels:", err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
