import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import "./BookHotelPopUp.css";
import { HotelDetailsDataProvider } from "../context/HotelDetailsContext";
import PersonalSection from "./Pop-Up-Sections/PersonalSection";
import StayDetailsSections from "./Pop-Up-Sections/StayDetailsSections";
import PaymentSection from "./Pop-Up-Sections/PaymentSection";
import { UserDataContext } from "../context/UserContext";
import api from "../api/api";

function loadRazorpayCheckout() {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Could not load secure checkout. Check your connection and try again."));
        document.body.appendChild(script);
    });
}

function BookHotelPopUp() {
    const { setIsPopUpOpen, currBookingDetails, userBookingData, bookHotel } = useContext(HotelDetailsDataProvider);
    const { user } = useContext(UserDataContext);
    const navigate = useNavigate();
    const sections = [<PersonalSection key="personal" />, <StayDetailsSections key="stay" />, <PaymentSection key="confirm" />];
    const [currentSection, setCurrentSections] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const hotel = currBookingDetails?.hotel;
    const room = hotel?.rooms?.[currBookingDetails?.roomIndex];
    const checkIn = new Date(`${userBookingData.check_in_date}T00:00:00`);
    const checkOut = new Date(`${userBookingData.check_out_date}T00:00:00`);
    const nights = Number.isFinite(checkIn.getTime()) && Number.isFinite(checkOut.getTime()) && checkOut > checkIn
        ? Math.ceil((checkOut - checkIn) / (24 * 60 * 60 * 1000)) : 1;
    const roomTotal = Number(room?.base_price || 0) * nights;
    const taxTotal = roomTotal * 0.18;

    async function handleNextClick() {
        if (currentSection < sections.length - 1) {
            if (currentSection === 1) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const guests = Number(userBookingData.number_of_guests);
                if (!userBookingData.check_in_date || !userBookingData.check_out_date || !Number.isFinite(checkIn.getTime()) || !Number.isFinite(checkOut.getTime())) {
                    setError("Choose check-in and check-out dates to continue.");
                    return;
                }
                if (checkIn < today || checkOut <= checkIn) {
                    setError("Choose a future check-in date and a later check-out date.");
                    return;
                }
                if (!Number.isInteger(guests) || guests < 1 || guests > Number(room?.capacity || 0)) {
                    setError(`Enter between 1 and ${room?.capacity || 0} guests for this room.`);
                    return;
                }
            }
            setError("");
            setCurrentSections((section) => section + 1);
            return;
        }

        setIsSubmitting(true);
        setError("");
        let booking;
        let checkoutCompleted = false;
        try {
            booking = await bookHotel();
            const { data: orderResponse } = await api.post(`/bookings/${booking._id}/razorpay-order`);
            const order = orderResponse.data;
            await loadRazorpayCheckout();
            const paymentResponse = await new Promise((resolve, reject) => {
                const checkout = new window.Razorpay({
                    key: order.keyId,
                    amount: order.amount,
                    currency: order.currency,
                    name: "Hotel Booking",
                    description: `${hotel?.name || "Hotel stay"} - ${nights} night${nights === 1 ? "" : "s"}`,
                    order_id: order.orderId,
                    prefill: {
                        name: [user?.first_name, user?.last_name].filter(Boolean).join(" "),
                        email: user?.email || "",
                        contact: user?.phone ? String(user.phone) : ""
                    },
                    theme: { color: "#2b7cff" },
                    handler: resolve,
                    modal: { ondismiss: () => reject(new Error("Payment was cancelled. Please try again when you are ready.")) }
                });
                checkout.open();
            });
            checkoutCompleted = true;
            await api.post(`/bookings/${booking._id}/razorpay-verify`, paymentResponse);
            setIsPopUpOpen(false);
            navigate(`/booking/success/${booking._id}`);
        } catch (err) {
            if (booking && !checkoutCompleted) {
                await api.post(`/bookings/${booking._id}/razorpay-failed`).catch(() => {});
            }
            setError(err?.response?.data?.message || "We couldn't save your booking. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    function handlePrevClick() {
        if (currentSection > 0 && !isSubmitting) {
            setError("");
            setCurrentSections((section) => section - 1);
        }
    }

    return (
        <div className="book-hotel-pop-up" onClick={() => !isSubmitting && setIsPopUpOpen(false)}>
            <div onClick={(event) => event.stopPropagation()} className="pop-up-main" role="dialog" aria-modal="true" aria-label="Complete your hotel booking">
                <button className="booking-close" type="button" aria-label="Close booking" onClick={() => setIsPopUpOpen(false)} disabled={isSubmitting}><FiX /></button>
                <div className="left-panel">
                    <div className="booking-hotel-name"><span className="booking-summary-eyebrow">YOUR STAY</span><h2>{hotel?.name}</h2><p>{hotel?.address}</p></div>
                    <div className="booking-room-details">
                        <h3>{room?.name}</h3><p>{room?.description}</p>
                        <p className="capacity"><span>Capacity: </span><span>{room?.capacity}</span></p>
                        <p className="booking-night-count">{nights} night{nights === 1 ? "" : "s"}</p>
                    </div>
                    <div className="booking-room-price">
                        <div className="price-per-night"><span>Room total</span><span>₹{roomTotal.toLocaleString("en-IN")}</span></div><div className="tax"><span>Tax (18%)</span><span>₹{taxTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div><div className="total"><span>Total to pay online</span><span>₹{(roomTotal + taxTotal).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>
                    </div>
                </div>
                <div className="right-panel">
                    <div className="booking-step-caption">Step {currentSection + 1} of {sections.length}</div>
                    <div className="section-header-main">
                        <div className="section-header">{sections.map((_, index) => <div className={`section ${currentSection === index ? "active" : ""} ${currentSection > index ? "completed" : ""}`} aria-current={currentSection === index ? "step" : undefined} key={index}><span>{currentSection > index ? "✓" : index + 1}</span></div>)}</div>
                        <div className="section-header-labels"><div className="header-label">Your details</div><div className="header-label">Stay details</div><div className="header-label">Confirm</div></div>
                    </div>
                    {sections[currentSection]}
                    {error && <div className="booking-form-error" role="alert">{error}</div>}
                    <div className="pop-up-footer">
                        <div className="prev-btn"><button onClick={handlePrevClick} disabled={currentSection === 0 || isSubmitting}>Previous</button></div>
                        <div className="next-btn"><button onClick={handleNextClick} disabled={isSubmitting}>{isSubmitting ? "Opening checkout..." : currentSection === sections.length - 1 ? "Pay securely" : "Next"}</button></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookHotelPopUp;

