import "./MyBookings.css";
import { useCallback, useContext, useEffect, useState } from "react";
import api from "../api/api";
import { UserDataContext } from "../context/UserContext"
function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState("");
    const [expandedBookingId, setExpandedBookingId] = useState("");
    const [showAllBookings, setShowAllBookings] = useState(false);
    const [reviewedBookingIds, setReviewedBookingIds] = useState([]);
    const [reviewBookingId, setReviewBookingId] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewNotice, setReviewNotice] = useState("");
    const { user, loading } = useContext(UserDataContext);
    const getData = useCallback(async () => {
        try {
            const res = await api.get(`/bookings/user/${user.id}`);
            setBookings(Array.isArray(res?.data?.data) ? res.data.data : []);
            try {
                const myReviews = await api.get("/reviews/mine");
                setReviewedBookingIds(Array.isArray(myReviews?.data?.data) ? myReviews.data.data : []);
            } catch {
                setReviewedBookingIds([]);
            }
        }
        catch (err) {
            console.log(err);
            alert(err?.response?.data?.message || "Inernal Server Error");
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    async function cancelBooking(id) {
        if (!window.confirm("Cancel this booking? This action cannot be undone.")) return;
        setCancellingId(id);
        try {
            const res = await api.put(`/bookings/cancel/${id}`);
            if (res.status === 200) {
                setBookings((current) => current.map((booking) => booking._id === id ? { ...booking, status: "cancelled" } : booking));
            }
        }
        catch (err) {
            alert(err?.response?.data?.message || "Unable to cancel booking");
        } finally {
            setCancellingId("");
        }
    }

    async function submitReview(event) {
        event.preventDefault();
        if (!reviewBookingId || reviewSubmitting) return;
        setReviewSubmitting(true);
        setReviewError("");
        try {
            await api.post("/reviews", { booking_id: reviewBookingId, rating: reviewRating, comment: reviewComment });
            setReviewedBookingIds((current) => [...new Set([...current, reviewBookingId])]);
            setReviewBookingId("");
            setReviewRating(5);
            setReviewComment("");
            setReviewNotice("Thanks for sharing your stay. Your review now appears on the homepage.");
        } catch (err) {
            setReviewError(err?.response?.data?.message || "Could not submit your review. Please try again.");
        } finally {
            setReviewSubmitting(false);
        }
    }
    useEffect(() => {
        if (!loading && user?.id) {
            getData();
        } else if (!loading) {
            setIsLoading(false);
        }
    }, [loading, user?.id, getData]);

    const filteredBookings = bookings
        .filter((booking) => statusFilter === "all" || booking.status === statusFilter)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const visibleBookings = showAllBookings ? filteredBookings : filteredBookings.slice(0, 5);
    const formatDate = (value) => value && !Number.isNaN(new Date(value).getTime())
        ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
        : "—";
    const formatPrice = (value) => new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", maximumFractionDigits: 0,
    }).format(Number(value) || 0);

    function getBookingAction(booking) {
        const { status, _id: id } = booking;
        if (status == "pending" || status == "confirmed") {
            return <div className="my-booking-action">
                <button type="button" className="my-booking-action-btn cancel-booking" disabled={cancellingId === id} onClick={() => cancelBooking(id)}>
                    {cancellingId === id ? "Cancelling…" : "Cancel booking"}
                </button>
            </div>
        }
        else if(status == "cancelled"){
            return <div className="my-booking-action">
                <div className="canceled-booking">
                    <span>Cancelled</span>
                </div>
            </div>
        }
        if (status === "completed" && booking.payment_status === "success") {
            return <div className="my-booking-action">
                {reviewedBookingIds.includes(id)
                    ? <span className="my-booking-reviewed">Review submitted</span>
                    : <button type="button" className="my-booking-action-btn write-review" onClick={() => { setReviewBookingId(id); setReviewError(""); setReviewNotice(""); }}>
                        Write Review
                    </button>}
            </div>
        }
        return <div className="my-booking-action"><span className="my-booking-review-locked">Complete your paid stay to review</span></div>
    }
    return (
        <section className="my-bookings-main">
            <div className="my-bookings-header">
                <div className="my-bookings-header-main">
                    <h2>My Bookings</h2>
                </div>

                <div className="my-bookings-filter">
                    <label htmlFor="booking-status-filter">Filter bookings</label>
                    <select id="booking-status-filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setShowAllBookings(false); }}>
                        <option value="all">All bookings ({bookings.length})</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>
            {reviewNotice && <p className="my-booking-review-notice" role="status">{reviewNotice}</p>}

            <div className="my-bookings-container">
                {isLoading ? <div className="my-bookings-empty"><span className="my-bookings-empty-icon">⌛</span><h3>Loading your stays</h3><p>Your booking details will be here in a moment.</p></div>
                    : visibleBookings.length === 0 ? <div className="my-bookings-empty"><span className="my-bookings-empty-icon">⌂</span><h3>{bookings.length ? "No bookings match this filter" : "Your next stay starts here"}</h3><p>{bookings.length ? "Choose another status to see your bookings." : "Once you book a hotel, all your stay details will appear here."}</p></div>
                    : visibleBookings.map((data) => {
                        const isExpanded = expandedBookingId === data._id;
                        return <article className={`my-booking-card${isExpanded ? " is-expanded" : ""}`} key={data._id}>
                            <div className="my-booking-card-header">
                                <div className="my-booking-hotel-name">
                                    <h2>{data?.hotel_id?.name}</h2>
                                    <div className="hotel-location">
                                        <span>{data?.hotel_id?.address}</span>
                                    </div>
                                </div>
                                <div className="booking-id">
                                    <span>Booking ref.</span>
                                    <strong>{data?._id?.substring(0, 8)?.toUpperCase()}</strong>
                                </div>
                            </div>
                            <div className="my-booking-status-row"><span className={`my-booking-status status-${data?.status || "pending"}`}>{data?.status || "pending"}</span><span className="my-booking-payment-status">Payment {data?.payment_status || "pending"}</span></div>
                            {isExpanded && <div className="my-booking-card-info">
                                <div>
                                    <span>Check-In Date</span>
                                    <strong>{formatDate(data?.check_in_date)}</strong>
                                </div>
                                <div>
                                    <span>Check-Out Date</span>
                                    <strong>{formatDate(data?.check_out_date)}</strong>
                                </div>
                                <div>
                                    <span>Book Date</span>
                                    <strong>{formatDate(data?.createdAt)}</strong>
                                </div>
                                <div>
                                    <span>Number Of Guests</span>
                                    <strong>{data?.number_of_guests} {Number(data?.number_of_guests) === 1 ? "guest" : "guests"}</strong>
                                </div>
                                <div>
                                    <span>Room Name</span>
                                    <strong>{data?.room_id?.name || "—"}</strong>
                                </div>
                                <div>
                                    <span>Payment Status</span>
                                    <strong>{data?.payment_status || "pending"}</strong>
                                </div>
                            </div>}
                            <div className="my-booking-card-footer">
                                <div className="my-booking-price">
                                    <span>{formatPrice(data?.final_amount)}</span>
                                </div>
                                <button type="button" className="my-booking-view-btn" aria-expanded={isExpanded} onClick={() => setExpandedBookingId(isExpanded ? "" : data._id)}>
                                    {isExpanded ? "Hide details" : "View details"}
                                </button>
                                {getBookingAction(data)}
                            </div>
                            {reviewBookingId === data._id && <form className="booking-review-form" onSubmit={submitReview}>
                                <div className="booking-review-form-heading">
                                    <div><h3>Review your stay</h3><p>{data?.hotel_id?.name}</p></div>
                                    <button type="button" className="booking-review-close" onClick={() => { setReviewBookingId(""); setReviewError(""); }} aria-label="Close review form">×</button>
                                </div>
                                <fieldset className="booking-review-rating">
                                    <legend>Your rating</legend>
                                    {Array.from({ length: 5 }, (_, index) => {
                                        const rating = index + 1;
                                        return <button key={rating} type="button" aria-label={`${rating} star${rating > 1 ? "s" : ""}`} aria-pressed={reviewRating === rating} className={rating <= reviewRating ? "is-selected" : ""} onClick={() => setReviewRating(rating)}>★</button>;
                                    })}
                                </fieldset>
                                <label className="booking-review-comment">Your review<textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} minLength={10} maxLength={1000} placeholder="What did you enjoy about your stay?" required /></label>
                                <div className="booking-review-form-footer">
                                    <small>{reviewComment.length}/1,000 characters</small>
                                    <button type="submit" disabled={reviewSubmitting || reviewComment.trim().length < 10}>{reviewSubmitting ? "Submitting…" : "Submit review"}</button>
                                </div>
                                {reviewError && <p className="booking-review-error" role="alert">{reviewError}</p>}
                            </form>}
                        </article>
                    })
                }
            </div>
            {!isLoading && filteredBookings.length > 5 && <button type="button" className="my-bookings-view-all" onClick={() => setShowAllBookings((current) => !current)}>
                {showAllBookings ? "Show latest 5" : `View all ${filteredBookings.length} bookings`}
            </button>}
        </section>
    )
}

export default MyBookings;
