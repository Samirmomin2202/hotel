import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLocationDot } from "react-icons/fa6";
import { FaCalendarDays } from "react-icons/fa6";
import { FaUsers } from "react-icons/fa6";
import "./Hero.css";
function Hero() {
    const [searchData, setSearchData] = useState({ location: "", checkIn: "", checkOut: "", guests: "" });
    const navigate = useNavigate();

    function handleChange(e) {
        setSearchData({ ...searchData, [e.target.name]: e.target.value });
    }

    function handleSearch() {
        const params = new URLSearchParams();
        if (searchData.location.trim()) params.set("hotelname", searchData.location.trim());
        if (searchData.checkIn) params.set("checkIn", searchData.checkIn);
        if (searchData.checkOut) params.set("checkOut", searchData.checkOut);
        if (searchData.guests) params.set("guests", searchData.guests);
        navigate(`/hotels?${params.toString()}`);
    }

    return (
        <section id="hero">
            <div id="hero-content">
                <span className="hero-badge">✦ India&apos;s #1 Hotel Booking Platform</span>
                <h1>Book Your Next Destination</h1>
                <p>Book luxury hotels and resorts all over the world</p>
                <div id="search-box">
                    <div>
                        <label htmlFor="location"><FaLocationDot /> Location</label>
                        <input type="text" id="location" name="location" value={searchData.location} onChange={handleChange} placeholder="Enter Location" />
                    </div>
                    <div>
                        <label htmlFor="date"><FaCalendarDays /> Check-in</label>
                        <input type="date" id="date" name="checkIn" value={searchData.checkIn} onChange={handleChange} />
                    </div>
                    <div>
                        <label htmlFor="checkout"><FaCalendarDays /> Check-out</label>
                        <input type="date" id="checkout" name="checkOut" value={searchData.checkOut} onChange={handleChange} />
                    </div>
                    <div>
                        <label htmlFor="npeople"><FaUsers /> Number of People</label>
                        <input type="number" id="npeople" name="guests" value={searchData.guests} onChange={handleChange} placeholder="2" min="1" />
                    </div>
                    <div id="search-btn">
                        <button onClick={handleSearch}>Search</button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero;
