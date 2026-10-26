import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiCheck } from "react-icons/fi";
import api from "../api/api";
import { UserDataContext } from "../context/UserContext";
import "./BookingSuccess.css";

function BookingSuccess() {
    const { id } = useParams();
    const { user, loading: userLoading } = useContext(UserDataContext);
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (userLoading) return;
        if (!user) {
            navigate("/login", { replace: true, state: { from: `/booking/success/${id}` } });
            return;
        }
        let active = true;
        api.get(`/bookings/${id}`)
            .then((response) => {
                if (active) setBooking(response.data.data);
            })
            .catch((err) => {
                if (active) setError(err?.response?.data?.message || "We couldn't load your booking confirmation.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [id, user, userLoading, navigate]);

    if (userLoading || loading) return <main className="booking-success-page"><p className="booking-success-loading">Loading your confirmationâ€¦</p></main>;

    return (
        <main className="booking-success-page">
            {error || !booking ? <section className="booking-confirmation-card booking-confirmation-error">
                <h1>We couldn't find that booking</h1>
                <p>{error || "Please check My Bookings or contact support."}</p>
                <Link to="/my-bookings" className="booking-success-primary">View my bookings</Link>
            </section> : <section className="booking-confirmation-card">
                <div className="booking-success-check"><FiCheck /></div>
                <p className="booking-success-eyebrow">PAYMENT CONFIRMED</p>
                <h1>Your stay is confirmed</h1>
                <p className="booking-success-description">Your Razorpay payment was verified and your booking is confirmed. You can view your stay details from My Bookings.</p>

                <div className="booking-confirmation-status"><span>Status</span><strong>{booking.status}</strong></div>
                <div className="booking-confirmation-details">
                    <div><span>Booking reference</span><strong>{booking._id}</strong></div>
                    <div><span>Hotel</span><strong>{booking.hotel_id?.name || "Hotel"}</strong></div>
                    <div><span>Room</span><strong>{booking.room_id?.name || "Room"}</strong></div>
                    <div><span>Check-in</span><strong>{booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "â€”"}</strong></div>
                    <div><span>Check-out</span><strong>{booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : "â€”"}</strong></div>
                    <div><span>Guests</span><strong>{booking.number_of_guests}</strong></div>
                </div>
                <div className="booking-confirmation-total"><span>Paid online</span><strong>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(booking.final_amount || 0))}</strong></div>
                <p className="booking-payment-note">Payment verified securely by Razorpay. Reference: {booking.transaction_id || "confirmed"}</p>
                <div className="booking-success-actions">
                    <Link to="/my-bookings" className="booking-success-primary">View my bookings</Link>
                    <Link to="/hotels" className="booking-success-secondary">Browse hotels</Link>
                </div>
            </section>}
        </main>
    );
}

export default BookingSuccess;

