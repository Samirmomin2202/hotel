import { createContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/api";

export const HotelDataProvider = createContext();

function HotelsDataContext({ children }) {
    const [hotels, setHotels] = useState([]);
    const [pagination, setPagination] = useState({});
    const [availableFilters, setAvailableFilters] = useState({ cities: [], categories: [] });
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const queryString = searchParams.toString();

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/hotels/hotels?${queryString}`, { signal: controller.signal });
                setHotels(data?.data?.hotels || []);
                setPagination(data?.data?.pagination || {});
                setAvailableFilters(data?.data?.filters || { cities: [], categories: [] });
            } catch (error) {
                if (error.name !== "CanceledError" && error.name !== "AbortError") {
                    setHotels([]);
                    setPagination({});
                    console.error("Unable to load hotels", error);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 180);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [queryString]);

    const page = searchParams.get("page") || "1";
    const rating = searchParams.get("rating") || "";
    const destinations = searchParams.getAll("destination");
    const categories = searchParams.getAll("category");
    const minPrice = searchParams.get("minPrice") || "0";
    const maxPrice = searchParams.get("maxPrice") || "100000";

    function updateFilters(update) {
        const next = new URLSearchParams(searchParams);
        update(next);
        next.set("page", "1");
        setSearchParams(next);
    }

    function toggleMultiValue(key, value) {
        updateFilters((next) => {
            const selected = next.getAll(key);
            next.delete(key);
            (selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
                .forEach((item) => next.append(key, item));
        });
    }

    function handleLocationChange(location) {
        toggleMultiValue("destination", location);
    }

    function handleCategoryChange(category) {
        toggleMultiValue("category", category);
    }

    function handleRatingChange(newRating) {
        updateFilters((next) => {
            if (next.get("rating") === String(newRating)) next.delete("rating");
            else next.set("rating", String(newRating));
        });
    }

    function handlePriceChange(newPrice) {
        updateFilters((next) => next.set("maxPrice", String(newPrice)));
    }

    const value = useMemo(() => ({
        hotels, setHotels, page, rating, destinations, categories, minPrice, maxPrice,
        pagination, availableFilters, loading, handleCategoryChange, handleLocationChange,
        handleRatingChange, handlePriceChange
    }), [hotels, page, rating, destinations.join("|"), categories.join("|"), minPrice, maxPrice, pagination, availableFilters, loading, queryString]);

    return <HotelDataProvider.Provider value={value}>{children}</HotelDataProvider.Provider>;
}

export default HotelsDataContext;
