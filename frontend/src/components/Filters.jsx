import { useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { IoStarSharp } from "react-icons/io5";
import { HotelDataProvider } from "../context/HotelsDataContext";
import "./Filters.css";

const MAX_FILTER_PRICE = 100000;

function displayCategory(category) {
    return String(category).split("-").map((part) => part ? part[0].toUpperCase() + part.slice(1) : "").join("-");
}

function Filters() {
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        rating, destinations, categories, maxPrice, availableFilters,
        handleCategoryChange, handleLocationChange, handleRatingChange, handlePriceChange
    } = useContext(HotelDataProvider);

    function clearAllFilters() {
        const next = new URLSearchParams(searchParams);
        ["rating", "destination", "category", "minPrice", "maxPrice"].forEach((key) => next.delete(key));
        next.set("page", "1");
        setSearchParams(next);
    }

    const selectedMaxPrice = Math.min(MAX_FILTER_PRICE, Math.max(0, Number(maxPrice) || MAX_FILTER_PRICE));

    return (
        <aside className="filters" aria-label="Filter hotels">
            <div className="filters-heading">
                <div><h2>Filters</h2><p>Refine your stay</p></div>
                <button type="button" className="clear-all-btn" onClick={clearAllFilters}>Clear all</button>
            </div>

            <section className="filter-columns" aria-labelledby="filter-price-heading">
                <h3 id="filter-price-heading">Maximum price per night</h3>
                <input
                    type="range"
                    className="price-range-slider"
                    min="0"
                    max={MAX_FILTER_PRICE}
                    step="500"
                    value={selectedMaxPrice}
                    aria-label="Maximum price per night"
                    onChange={(event) => handlePriceChange(event.target.value)}
                />
                <div className="price-range"><span>₹0</span><span>Up to ₹{selectedMaxPrice.toLocaleString("en-IN")}</span></div>
            </section>

            <section className="filter-columns" aria-labelledby="filter-rating-heading">
                <h3 id="filter-rating-heading">Guest rating</h3>
                <div className="filter-column">
                    {[5, 4, 3].map((value) => {
                        const id = `rating-${value}`;
                        return <div className="filter-options" key={value}>
                            <input id={id} type="checkbox" checked={String(rating) === String(value)} onChange={() => handleRatingChange(value)} />
                            <label htmlFor={id}><span className="stars-conatiner">{Array.from({ length: value }, (_, index) => <IoStarSharp key={index} />)}</span> &amp; up</label>
                        </div>;
                    })}
                </div>
            </section>

            {!!availableFilters?.cities?.length && <section className="filter-columns" aria-labelledby="filter-location-heading">
                <h3 id="filter-location-heading">Location</h3>
                <div className="filter-column">
                    {availableFilters.cities.map((city) => {
                        const id = `city-${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                        return <div className="filter-options" key={city}>
                            <input id={id} type="checkbox" checked={destinations.includes(city)} onChange={() => handleLocationChange(city)} />
                            <label htmlFor={id}>{city}</label>
                        </div>;
                    })}
                </div>
            </section>}

            {!!availableFilters?.categories?.length && <section className="filter-columns" aria-labelledby="filter-category-heading">
                <h3 id="filter-category-heading">Hotel type</h3>
                <div className="filter-column">
                    {availableFilters.categories.map((category) => {
                        const id = `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                        return <div className="filter-options" key={category}>
                            <input id={id} type="checkbox" checked={categories.includes(category)} onChange={() => handleCategoryChange(category)} />
                            <label htmlFor={id}>{displayCategory(category)}</label>
                        </div>;
                    })}
                </div>
            </section>}
        </aside>
    );
}

export default Filters;
