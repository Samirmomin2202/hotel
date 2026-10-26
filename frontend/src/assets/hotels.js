import img1 from "./hotel1.jpg";
import img2 from "./hotel2.png"
const featuredHotels = [
  {
    id: 1,
    name: "Taj Rishikesh Resort",
    location: "Uttarakhand, Rishikesh",
    rating: 4.7,
    pricePerNight: 42000,
    image: img1,
    description: "The in-house banquet hall is perfect to host corporate events, weddings and get-togethers.",
    category: "Resort",
    amenities: ["WiFi", "AC", "Restaurant"]
  },
  {
    id: 2,
    name: "Royal Heritage Palace",
    location: "Jaipur, India",
    rating: 4.8,
    pricePerNight: 4299,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    description: "A royal palace hotel offering premium heritage-style rooms.",
    category: "Luxury",
    amenities: ["WiFi", "AC", "Restaurant"]
  },
  {
    id: 3,
    name: "Mountain View Retreat",
    location: "Manali, India",
    rating: 4.6,
    pricePerNight: 8900,
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
    description: "A peaceful retreat surrounded by snow-covered mountains.",
    category: "Cottage",
    amenities: ["WiFi", "AC", "Restaurant"]
  },
  {
    id: 4,
    name: "The Grand Orchid",
    location: "Mumbai, India",
    rating: 4.5,
    pricePerNight: 6100,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
    description: "5-star hotel with rooftop pool, spa & luxury dining.",
    category: "5-Star",
    amenities: ["WiFi", "AC", "Restaurant"]
  },
  {
    id: 5,
    name: "Lake View Residency",
    location: "Udaipur, India",
    rating: 4.9,
    pricePerNight: 7200,
    image: img2,
    description: "Premium lake-facing rooms with boat tour packages.",
    category: "Luxury",
    amenities: ["WiFi", "AC", "Restaurant"]
  },
  {
    id: 6,
    name: "City Comfort Inn",
    location: "Delhi, India",
    rating: 4.3,
    pricePerNight: 7999,
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c",
    description: "Affordable comfort hotel perfect for family & business stay.",
    category: "Budget",
    amenities: ["WiFi", "AC", "Restaurant"]
  }
];

export default featuredHotels;
