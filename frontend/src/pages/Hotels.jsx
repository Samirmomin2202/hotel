import HotelsHero from "../components/HotelsHero";
import SearchBox from "../components/SearchBox";
import HotelCard from "../components/HotelCard";
import "./Hotels.css"
import Filters from "../components/Filters";
import { useContext, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HotelDataProvider } from "../context/HotelsDataContext";
function Hotels() {
    const { hotels, pagination } = useContext(HotelDataProvider);
    const [searchParams, setSearchParams] = useSearchParams();
    const [sortBy, setSortBy] = useState("default");
    let pages = pagination?.totalPages;
    let currentPage = pagination?.page;

    function goToPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > pages) return;
        searchParams.set("page", pageNumber);
        setSearchParams(searchParams);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    let sortedHotels = [...hotels];
    if (sortBy === "price-low") sortedHotels.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === "price-high") sortedHotels.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sortBy === "rating") sortedHotels.sort((a, b) => (b.star_rating || 0) - (a.star_rating || 0));

    return (
        <>
            <HotelsHero />
            <SearchBox />
            <main className="hotels-main-container">
                <Filters />
                <div className="hotels-grid-container">
                    <div className="hotels-header">
                        <h2 className="number-of-hotels">{pagination?.total} Results Found</h2>
                        <div className="hotels-sort">
                            <label htmlFor="sort-hotels">Sort Hotels</label>
                            <select id="sort-hotels" className="sort-hotels" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="default">Default</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Rating: High to Low</option>
                            </select>
                        </div>
                    </div>

                    <div className="hotels-card-container">
                        {
                            sortedHotels.length > 0 ?
                                sortedHotels.map((hotel, index) => {
                                    return <HotelCard data={hotel} key={index} />
                                })
                                :
                                <div className="no-hotels-found">
                                    <p>😔 No hotels found</p>
                                    <span>Try removing some filters or search for a different destination.</span>
                                </div>
                        }
                    </div>

                    {
                        pages > 1 &&
                        <div className="hotels-pagination">
                            <button className="page-nav-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>Prev</button>
                            {
                                new Array(pages).fill(0).map((el, ix) => {
                                    return <button key={ix} className={`${currentPage == ix + 1 && "active-btn"}`} onClick={() => goToPage(ix + 1)}>{ix + 1}</button>
                                })
                            }
                            <button className="page-nav-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pages}>Next</button>
                        </div>
                    }
                </div>
            </main>
        </>
    )
}

export default Hotels;
