import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import HotelCard from "./HotelCard";
import "./FeaturedHotels.css";

function FeaturedHotels() {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let isCurrent = true;

        api.get("/hotels/hotels?limit=6")
            .then(({ data }) => {
                if (isCurrent) setHotels(data?.data?.hotels || []);
            })
            .catch(() => {
                if (isCurrent) setHasError(true);
            })
            .finally(() => {
                if (isCurrent) setLoading(false);
            });

        return () => { isCurrent = false; };
    }, []);

    return (
        <section id="featured-hotels">
            <h1>Featured Hotels</h1>
            <p>Find the best hotels across the world</p>
            {loading ? (
                <div className="featured-hotels-message" role="status">Loading available hotels…</div>
            ) : hotels.length ? (
                <div id="hotels-grid">
                    {hotels.map((hotel) => <HotelCard key={hotel._id} data={hotel} />)}
                </div>
            ) : (
                <div className="featured-hotels-message">
                    <p>{hasError ? "Hotels are temporarily unavailable." : "No bookable hotels are listed yet."}</p>
                    <span>{hasError ? "Please try again in a moment." : "Browse all listings or check back soon."}</span>
                    <Link to="/hotels">Browse hotels</Link>
                </div>
            )}
        </section>
    );
}

export default FeaturedHotels;
