import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./SearchBox.css";

function SearchBox() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [location, setLocation] = useState(searchParams.get("hotelname") || "");
    const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
    const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
    const [guests, setGuests] = useState(searchParams.get("guests") || "");

    function handleSearch() {
        if (location.trim()) searchParams.set("hotelname", location.trim());
        else searchParams.delete("hotelname");
        if (checkIn) searchParams.set("checkIn", checkIn);
        else searchParams.delete("checkIn");
        if (checkOut) searchParams.set("checkOut", checkOut);
        else searchParams.delete("checkOut");
        if (guests) searchParams.set("guests", guests);
        else searchParams.delete("guests");
        searchParams.set("page", 1);
        setSearchParams(searchParams);
    }

    return (
        <section className="search-box-conatiner">
            <div className="search-box">
                <div className="search-box-input-conatiner">
                    <label htmlFor="location">Location</label>
                    <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or hotel name" />
                </div>
                <div className="search-box-input-conatiner">
                    <label htmlFor="check-in-date">Check-in date</label>
                    <input type="date" id="check-in-date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                </div>
                <div className="search-box-input-conatiner">
                    <label htmlFor="check-out-date">Check-out date</label>
                    <input type="date" id="check-out-date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                </div>
                <div className="search-box-input-conatiner">
                    <label htmlFor="number-of-people">Number of people</label>
                    <input type="number" id="number-of-people" value={guests} min="1" onChange={(e) => setGuests(e.target.value)} placeholder="2" />
                </div>
                <div className="search-box-button">
                    <button onClick={handleSearch}>Search</button>
                </div>
            </div>
        </section>
    )
}

export default SearchBox