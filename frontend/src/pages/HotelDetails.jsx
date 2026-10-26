import { useParams, useNavigate } from "react-router-dom";
import "./HotelDetails.css";
import { useContext, useEffect, useState } from "react";
import { IoStarSharp } from "react-icons/io5";
import { LuUsers } from "react-icons/lu";
import { FaBed } from "react-icons/fa";
import { FaRegMap } from "react-icons/fa";
import BookHotelPopUp from "../components/BookHotelPopUp";
import { UserDataContext } from "../context/UserContext";
import { HotelDetailsDataProvider } from "../context/HotelDetailsContext";
import api from "../api/api";
import { resolveImageUrl } from "../utils/imageUrl";
import fallbackHotelImage from "../assets/hotel1.jpg";
import demoHotels from "../assets/demo_hotels_data";

function HotelDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [hotelData, setHotelData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isDemoHotel, setIsDemoHotel] = useState(false);
    const { user } = useContext(UserDataContext);
    useEffect(() => {
        let isCurrentRequest = true;
        setLoading(true);
        setLoadError("");
        setHotelData(null);
        setIsDemoHotel(false);
        setSelectedImage(0);

        const demoHotel = demoHotels.find((hotel) => String(hotel.id) === id);
        if (demoHotel) {
            setHotelData(demoHotel);
            setIsDemoHotel(true);
            setLoading(false);
            return () => { isCurrentRequest = false; };
        }

        if (!/^[a-f\d]{24}$/i.test(id || "")) {
            setLoadError("This hotel could not be found.");
            setLoading(false);
            return () => { isCurrentRequest = false; };
        }

        api.get(`/hotels/hotel/${id}`)
            .then((res) => {
                if (isCurrentRequest) setHotelData(res?.data?.data || null);
            })
            .catch((err) => {
                if (isCurrentRequest) setLoadError(err?.response?.data?.message || "We couldn't load this hotel. Please try again.");
            })
            .finally(() => {
                if (isCurrentRequest) setLoading(false);
            });

        return () => { isCurrentRequest = false; };
    }, [id]);

    //hotel facts array
    const hotelFacts = [
        { key: "Contact Email", value: hotelData?.contact_email },
        { key: "Contact Phone", value: hotelData?.contact_phone },
        { key: "Check-In Time", value: hotelData?.check_in_time },
        { key: "Check-Out Time", value: hotelData?.check_out_time },
        { key: "Pets Allowed", value: hotelData?.policies?.pets ? "Yes" : "No" }
    ]

    function getBedNames(bed_types) {
        let ans = "";
        let arr = Object.entries(bed_types); //[["Kings",1],["Queen",1],["Twin",0]]
        for (let i of arr) {
            if (i[1] > 0) {
                ans += `${i[1]} ${i[0]} Bed + `
            }
        }
        ans = ans.substring(0, ans.length - 2);
        return ans;
    }

    // function that will run when user clicks on book room
    function handleRoomBook(roomData, roomIndex) {
        if (isDemoHotel) return;
        if (!user) {
            navigate("/login", { state: { from: `/hotel/${id}` } });
            return
        }
        setCurrBookingDetails({ hotel: hotelData, roomIndex: roomIndex })
        setIsPopUpOpen(true);
        setUserBookingData({
            user_id: user.id, hotel_id: hotelData._id, room_id: roomData._id,
            check_in_date: "", check_out_date: "", number_of_guests: "",
            total_amount: "", tax_amount: "", final_amount: "",
            special_requests: "", cancellation_reason: "", alternate_phone_number: ""
        })
    }
    const [selectedImage, setSelectedImage] = useState(0);
    const { isPopupOpen, setIsPopUpOpen, setCurrBookingDetails, setUserBookingData } = useContext(HotelDetailsDataProvider)
    if (loading) {
        return <div className="loading-state">Loading hotel details...</div>
    }
    if (loadError || !hotelData) {
        return <main className="hotel-details-main"><section className="hotel-load-error" role="alert">
            <h1>Hotel details unavailable</h1>
            <p>{loadError || "This hotel could not be found."}</p>
            <button type="button" onClick={() => navigate("/hotels")}>Browse hotels</button>
        </section></main>;
    }
    return (
        <>
            {/* Hotel Booking Pop Up Code  */}
            {isPopupOpen && <BookHotelPopUp />}

            <section className="hotel-details-main">
                <div className="hotel-details">
                    <div className="hotel-images">
                        <div className="main-image">
                            <img src={resolveImageUrl(hotelData?.images?.[selectedImage]) || fallbackHotelImage} alt={`${hotelData?.name || "Hotel"} exterior`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackHotelImage; }} />
                        </div>
                        <div className="images-card-container">
                            {
                                hotelData?.images?.map((hotelImage, index) => {
                                    return <button type="button" aria-label={`Show hotel photo ${index + 1}`} aria-pressed={index === selectedImage} className={`image-card ${index === selectedImage ? "selected" : ""}`} key={index} onClick={() => setSelectedImage(index)}>
                                        <img src={resolveImageUrl(hotelImage) || fallbackHotelImage} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackHotelImage; }} />
                                    </button>
                                })
                            }
                        </div>
                    </div>
                    <div className="hotel-content">
                        <h1>{hotelData.name}</h1>
                        <div className="hotel-location">
                            <span>{hotelData.address}</span>
                        </div>
                        <div className="hotel-ratings">
                            <span>{hotelData.star_rating}</span>
                            <div className="stars">
                                {
                                    Array.from({ length: Math.max(0, Math.min(5, Number(hotelData.star_rating) || 0)) }).map((_, index) => {
                                        return <IoStarSharp key={index} className="star" />
                                    })
                                }
                            </div>
                        </div>
                        <div className="hotel-price">₹{Number(hotelData.price || 0).toLocaleString("en-IN")} <span>/ night</span></div>
                        <div className="hotel-description">
                            <p>{hotelData.description}</p>
                        </div>
                        <div className="hotel-booking-btn">
                            <button onClick={() => {
                                document.getElementById("rooms-section")?.scrollIntoView({ behavior: "smooth" });
                            }}>{isDemoHotel ? "View Rooms" : "View Rooms & Book"}</button>
                        </div>
                    </div>
                </div>

                {isDemoHotel && <p className="hotel-demo-notice" role="status">This is a sample listing. Room details are for preview only and cannot be booked.</p>}

                <div className="hotel-facts">
                    <h2>Hotel Facts</h2>
                    {
                        hotelFacts.map((fact, index) => {
                            return <div className="hotel-fact" key={index} style={{ borderBottom: index == hotelFacts.length - 1 && "none" }}>
                                <span>{fact.key}</span>
                                <span>{fact.value}</span>
                            </div>
                        })
                    }
                </div>

                <div className="rooms-container" id="rooms-section">
                    <h2>Available Rooms</h2>
                    <div className="rooms-grid">
                        {
                            hotelData?.rooms?.map((roomData, index) => {
                                return <div className="room-card" key={index}>
                                    <div className="room-image">
                                                <img src={resolveImageUrl(roomData.image) || fallbackHotelImage} alt={`${roomData.name} at ${hotelData.name}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackHotelImage; }} />
                                    </div>
                                    <div className="room-details">
                                        <div className="room-header">
                                            <h3>{roomData?.name}</h3>
                                            <div className="room-info">
                                                <div>
                                                    <span><LuUsers /></span>
                                                    <span>{roomData.capacity} Adults</span>
                                                </div>
                                                <div>
                                                    <span><FaBed /></span>
                                                    <span>
                                                        {
                                                            getBedNames(roomData.bed_type)
                                                        }
                                                    </span>
                                                </div>
                                                <div>
                                                    <span><FaRegMap /></span>
                                                    <span>{roomData.size_sqft} sq feet</span>
                                                </div>
                                            </div>
                                            <div className="room-description">
                                                {roomData.description}
                                            </div>
                                        </div>
                                        <div className="room-footer">
                                            <div className="room-price"><span>₹{Number(roomData.base_price || 0).toLocaleString("en-IN")}</span><span>/ night</span></div>
                                            <div className="room-book-btn">
                                                <button onClick={() => {
                                                    handleRoomBook(roomData, index)
                                                }} disabled={isDemoHotel} title={isDemoHotel ? "Demo hotel details are preview only" : undefined}>{isDemoHotel ? "Preview only" : "Book"}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            })
                        }
                    </div>
                </div>
            </section>
        </>
    )
}

export default HotelDetails

