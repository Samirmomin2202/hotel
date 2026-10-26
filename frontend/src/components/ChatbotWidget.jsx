import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowUpRight, FiMapPin, FiMaximize2, FiMessageCircle, FiMinimize2, FiSend, FiStar, FiX } from "react-icons/fi";
import { UserDataContext } from "../context/UserContext";
import api from "../api/api";
import { resolveImageUrl } from "../utils/imageUrl";
import "./ChatbotWidget.css";

function isExplicitBookingRequest(text) {
    const value = String(text || '').trim();
    return /\b(?:book|reserve)\s+(?:me\s+)?(?:a|an|the|this|that)?\s*(?:hotel|room|stay)\b/i.test(value)
        || /\b(?:i want|i would like|i\x27d like|please help me|help me|can you|could you)\s+(?:to\s+)?(?:book|reserve)\b/i.test(value)
        || /\b(?:make|create)\s+(?:a\s+)?(?:booking|reservation)\b/i.test(value);
}

function getBookingPrefill(text) {
    const numberWords = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
    const guestMatch = text.match(/\b(?:for|with)\s+(\d{1,2}|one|two|three|four|five|six|seven|eight)\s+(?:guests?|people|persons?)\b/i);
    const destinationMatch = text.match(/\b(?:in|near|at)\s+([\p{L}\s-]+?)(?=\s+(?:for|from|between|check[ -]?in|check[ -]?out|on)\b|[,.!?]|$)/iu);
    const dates = [];
    for (const match of text.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)) dates.push(match[1]);
    for (const match of text.matchAll(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?\b/gi)) {
        const date = new Date(`${match[1]} ${match[2]}, ${match[3] || new Date().getFullYear()}`);
        if (Number.isFinite(date.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (!match[3] && date < today) date.setFullYear(date.getFullYear() + 1);
            dates.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
        }
    }
    const guestToken = guestMatch?.[1]?.toLowerCase();
    return {
        guests: guestToken ? Number(guestToken) || numberWords[guestToken] : null,
        destination: destinationMatch?.[1]?.trim() || "",
        checkIn: dates[0] || "",
        checkOut: dates[1] || ""
    };
}

function ChatbotWidget() {
    const { user } = useContext(UserDataContext);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [retryQuestion, setRetryQuestion] = useState("");
    const [conversationId, setConversationId] = useState(null);
    const [bookingFlow, setBookingFlow] = useState(false);
    const [bookingBusy, setBookingBusy] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [hotels, setHotels] = useState([]);
    const [bookingHotel, setBookingHotel] = useState(null);
    const [bookingDetails, setBookingDetails] = useState({ hotel_id: "", room_id: "", check_in_date: "", check_out_date: "", number_of_guests: 1, special_requests: "" });
    const [bookingProposal, setBookingProposal] = useState(null);
    const [messages, setMessages] = useState([
        { id: "welcome", from: "assistant", text: "Hi! I'm your hotel booking assistant. I can help you discover hotels, compare rooms, check availability, and complete a booking. Where would you like to stay?" }
    ]);
    const messageListRef = useRef(null);
    const chatScope = user ? `${user.role}:${user._id || user.id || user.email || "account"}` : "signed-out";

    useEffect(() => {
        setMessages([{ id: "welcome", from: "assistant", text: "Hi! I'm your hotel booking assistant. I can help you discover hotels, compare rooms, check availability, and complete a booking. Where would you like to stay?" }]);
        setConversationId(null);
        setRetryQuestion("");
        setError("");
    }, [chatScope]);

    useEffect(() => {
        messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, isOpen]);

    useEffect(() => {
        if (user?.role === "admin") {
            setBookingFlow(false);
            setBookingProposal(null);
        }
    }, [user?.role]);

    if (!user) return null;

    function getChatError(err) {
        if (err?.response?.status === 401) return "Your session expired. Sign in again to continue chatting.";
        if (err?.response?.status === 429) return "Too many requests. Please wait a moment and try again.";
        if ([502, 503, 504].includes(err?.response?.status)) return "The hotel help service is temporarily unavailable. Please try again.";
        if (err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT") return "That took too long. Please try again.";
        if (!err?.response) return "Could not reach the hotel help service. Check your connection and retry.";
        return "Could not send your message. Please try again.";
    }

    async function sendText(text, isRetry = false) {
        const question = text.trim();
        if (!question || sending) return;
        setMessage("");
        setError("");
        setRetryQuestion("");
        setSending(true);
        if (!isRetry) setMessages((current) => [...current, { id: `user-${Date.now()}`, from: "user", text: question }].slice(-80));
        if (user.role !== "admin" && isExplicitBookingRequest(question)) {
            setMessages((current) => [...current, {
                id: `assistant-${Date.now()}`,
                from: "assistant",
                text: "I can help you book. Select your hotel and stay details below. I’ll check availability, then ask you to approve the booking before secure payment."
            }].slice(-80));
            setBookingError("");
            setBookingProposal(null);
            setBookingFlow(true);
            const prefill = getBookingPrefill(question);
            let listedHotels = hotels;
            try {
                if (!listedHotels.length) {
                    const { data } = await api.get("/hotels/hotels?limit=50");
                    listedHotels = data?.data?.hotels || [];
                    setHotels(listedHotels);
                }
                const selectedHotel = prefill.destination
                    ? listedHotels.find((hotel) => String(hotel.city || "").toLowerCase().includes(prefill.destination.toLowerCase())
                        || String(hotel.name || "").toLowerCase().includes(prefill.destination.toLowerCase()))
                    : null;
                let selectedHotelDetails = null;
                if (selectedHotel) {
                    const { data } = await api.get(`/hotels/hotel/${selectedHotel._id}`);
                    selectedHotelDetails = data?.data || null;
                    setBookingHotel(selectedHotelDetails);
                }
                setBookingDetails((details) => ({
                    ...details,
                    hotel_id: selectedHotel?._id ? String(selectedHotel._id) : details.hotel_id,
                    room_id: "",
                    check_in_date: prefill.checkIn || details.check_in_date,
                    check_out_date: prefill.checkOut || details.check_out_date,
                    number_of_guests: prefill.guests || details.number_of_guests
                }));
            } catch (err) {
                setBookingError(err?.response?.data?.message || "Could not load hotel options. Please try again.");
            }
            setSending(false);
            return;
        }
        try {
            const response = await api.post("/chatbot/message", { message: question, conversation_id: conversationId }, { timeout: 20000 });
            const payload = response?.data?.data;
            if (response?.data?.success !== true || typeof payload?.answer !== "string" || !payload.answer.trim()) {
                throw new Error("Invalid chatbot response");
            }
            const { answer, source, conversation_id: nextConversationId } = payload;
            if (nextConversationId) setConversationId(nextConversationId);
            setMessages((current) => [...current, {
                id: `assistant-${Date.now()}`,
                from: "assistant",
                text: answer,
                hotelCards: Array.isArray(payload.hotelCards) ? payload.hotelCards : [],
                source: typeof source === "string" ? source : null
            }].slice(-80));
        } catch (err) {
            setError(getChatError(err));
            setRetryQuestion(question);
        } finally {
            setSending(false);
        }
    }

    function sendMessage(event) {
        event.preventDefault();
        sendText(message);
    }

    async function selectHotelForBooking(hotelCard) {
        if (bookingBusy || user.role === "admin") return;
        setBookingBusy(true);
        setBookingError("");
        setError("");
        try {
            const [hotelResponse, listResponse] = await Promise.all([
                api.get(`/hotels/hotel/${hotelCard.id}`),
                hotels.length ? Promise.resolve({ data: { data: { hotels } } }) : api.get("/hotels/hotels?limit=50")
            ]);
            const hotel = hotelResponse?.data?.data;
            if (!hotel?._id || !Array.isArray(hotel.rooms)) throw new Error("This hotel is no longer available.");
            setHotels(listResponse?.data?.data?.hotels || []);
            setBookingHotel(hotel);
            setBookingDetails((details) => ({ ...details, hotel_id: String(hotel._id), room_id: "" }));
            setBookingProposal(null);
            setBookingFlow(true);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Could not load this hotel. Please try again.");
        } finally {
            setBookingBusy(false);
        }
    }

    async function viewHotelDetails(hotelCard) {
        try {
            const { data } = await api.get(`/hotels/hotel/${hotelCard.id}`);
            const hotel = data?.data;
            if (!hotel) throw new Error("Hotel details are unavailable.");
            const roomSummary = (hotel.rooms || []).slice(0, 4).map((room) => `${room.name}: ${Number(room.base_price).toLocaleString("en-IN")} per night, up to ${room.capacity} guests`).join("\n");
            const details = [hotel.name, [hotel.address, hotel.city, hotel.country].filter(Boolean).join(", "), hotel.description, hotel.check_in_time ? `Check-in: ${hotel.check_in_time}` : null, hotel.check_out_time ? `Check-out: ${hotel.check_out_time}` : null, roomSummary ? `Rooms:\n${roomSummary}` : "No rooms are currently listed."].filter(Boolean).join("\n");
            setMessages((current) => [...current, { id: `assistant-${Date.now()}`, from: "assistant", text: details }].slice(-80));
        } catch (err) {
            setError(err?.response?.data?.message || "Could not load hotel details. Please try again.");
        }
    }

    async function chooseRoomForBooking(room) {
        if (bookingBusy || user.role === "admin") return;
        setBookingBusy(true);
        setBookingError("");
        setBookingProposal(null);
        try {
            if (!hotels.length) {
                const { data } = await api.get("/hotels/hotels?limit=50");
                setHotels(data?.data?.hotels || []);
            }
            const { data } = await api.get(`/hotels/hotel/${room.hotelId}`);
            const hotel = data?.data;
            if (!hotel?.rooms?.some((item) => String(item._id) === room.id)) {
                throw new Error("That room is no longer listed. Please ask for room recommendations again.");
            }
            setBookingHotel(hotel);
            setBookingDetails((details) => ({
                ...details,
                hotel_id: room.hotelId,
                room_id: room.id,
                number_of_guests: room.guestCount
            }));
            setBookingFlow(true);
        } catch (err) {
            const message = err?.message === "That room is no longer listed. Please ask for room recommendations again."
                ? err.message
                : "Could not load this room. Please try again.";
            setBookingError(message);
            setError(message);
        } finally {
            setBookingBusy(false);
        }
    }

    async function updateBookingField(event) {
        const { name, value } = event.target;
        setBookingDetails((details) => ({ ...details, [name]: name === "number_of_guests" ? Number(value) : value }));
        if (name === "hotel_id" && value) {
            setBookingHotel(null);
            setBookingProposal(null);
            setBookingDetails((details) => ({ ...details, room_id: "" }));
            try {
                const { data } = await api.get(`/hotels/hotel/${value}`);
                setBookingHotel(data?.data || null);
            } catch (err) {
                setBookingError(err?.response?.data?.message || "Could not load rooms for this hotel.");
            }
        }
    }

    async function prepareBooking(event) {
        event.preventDefault();
        if (!bookingDetails.hotel_id || !bookingDetails.room_id || !bookingDetails.check_in_date || !bookingDetails.check_out_date) {
            setBookingError("Choose a hotel, room, check-in date, and check-out date.");
            return;
        }
        setBookingBusy(true);
        setBookingError("");
        try {
            const { data } = await api.post("/bookings/check-availability", { roomId: bookingDetails.room_id, hotelId: bookingDetails.hotel_id, checkIn: bookingDetails.check_in_date, checkOut: bookingDetails.check_out_date, number_of_guests: bookingDetails.number_of_guests });
            if (!data?.isAvailable) throw new Error("This room is not available for those dates.");
            const room = bookingHotel?.rooms?.find((item) => String(item._id) === bookingDetails.room_id);
            const quote = data?.quote;
            if (!room || !quote || !Number.isFinite(Number(quote.final_amount))) throw new Error("The server could not prepare a booking quote. Please try again.");
            setBookingProposal({ ...bookingDetails, booking_request_id: window.crypto?.randomUUID?.() || `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`, hotelName: bookingHotel.name, roomName: room.name, nightlyRate: Number(quote.nightly_rate), nights: Number(quote.nights), subtotal: Number(quote.subtotal), taxAmount: Number(quote.tax_amount), total: Number(quote.final_amount) });
        } catch (err) {
            setBookingError(err?.response?.data?.message || err.message || "Could not check availability.");
        } finally {
            setBookingBusy(false);
        }
    }

    async function approveBooking() {
        if (!bookingProposal || bookingBusy) return;
        setBookingBusy(true);
        setBookingError("");
        let booking;
        let checkoutCompleted = false;
        try {
            const created = await api.post("/bookings", {
                hotel_id: bookingProposal.hotel_id,
                room_id: bookingProposal.room_id,
                check_in_date: bookingProposal.check_in_date,
                check_out_date: bookingProposal.check_out_date,
                number_of_guests: bookingProposal.number_of_guests,
                special_requests: bookingProposal.special_requests,
                expected_final_amount: bookingProposal.total,
                booking_request_id: bookingProposal.booking_request_id
            });
            booking = created.data.data;
            const { data: orderResponse } = await api.post(`/bookings/${booking._id}/razorpay-order`);
            const order = orderResponse.data;
            if (!window.Razorpay) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = resolve;
                    script.onerror = () => reject(new Error("Could not load secure checkout."));
                    document.body.appendChild(script);
                });
            }
            const payment = await new Promise((resolve, reject) => {
                const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: "Hotel Booking", description: `${bookingProposal.hotelName} · ${bookingProposal.nights} nights`, order_id: order.orderId, prefill: { name: [user?.first_name, user?.last_name].filter(Boolean).join(" "), email: user?.email || "", contact: user?.phone ? String(user.phone) : "" }, theme: { color: "#2b7cff" }, handler: resolve, modal: { ondismiss: () => reject(new Error("Payment was cancelled. Your booking is still pending payment.")) } });
                checkout.open();
            });
            checkoutCompleted = true;
            await api.post(`/bookings/${booking._id}/razorpay-verify`, payment);
            setBookingFlow(false);
            setBookingProposal(null);
            setMessages((current) => [...current, { id: `assistant-${Date.now()}`, from: "assistant", text: "Payment verified and your booking is confirmed." }]);
            navigate(`/booking/success/${booking._id}`);
        } catch (err) {
            if (booking && !checkoutCompleted) await api.post(`/bookings/${booking._id}/razorpay-failed`).catch(() => {});
            setBookingError(err?.response?.data?.message || err.message || "Could not complete booking.");
        } finally {
            setBookingBusy(false);
        }
    }

    return (
        <div className="chatbot-root">
            {isOpen && <section className={`chatbot-panel ${isFullscreen ? "chatbot-panel-fullscreen" : ""}`} aria-label="Hotel help chat">
                <header className="chatbot-header">
                    <div className="chatbot-brand">
                        <span className="chatbot-brand-icon"><FiMessageCircle /></span>
                        <div className="chatbot-brand-copy">
                        <strong>Hotel booking assistant</strong>
                        <span>{user.role === "admin" ? "Admin preview · all answers" : "Answers provided by the hotel team"}</span>
                        </div>
                    </div>
                    <span className="chatbot-connection" title="Authenticated hotel account"><i aria-hidden="true" /> Signed in</span>
                    <div className="chatbot-header-actions">
                        <button className="chatbot-icon-button" type="button" aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"} aria-pressed={isFullscreen} onClick={() => setIsFullscreen((fullscreen) => !fullscreen)}>
                            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                        </button>
                        <button className="chatbot-icon-button" type="button" aria-label="Close chat" onClick={() => { setIsOpen(false); setIsFullscreen(false); }}>
                            <FiX />
                        </button>
                    </div>
                </header>
                <div className="chatbot-messages" ref={messageListRef} aria-live="polite">
                    {messages.length === 1 ? <div className="chatbot-empty-state">
                        <span className="chatbot-empty-icon"><FiMessageCircle /></span>
                        <p className="chatbot-empty-eyebrow">HERE TO HELP, ANYTIME</p>
                        <h1>Find your next stay</h1>
                        <p className="chatbot-empty-copy">Hi! I'm your hotel booking assistant. I can help you discover hotels, compare rooms, check availability, and complete a booking. Where would you like to stay?</p>
                        <div className="chatbot-prompts" aria-label="Suggested questions">
                            {["Find hotels in Mumbai", "Show affordable hotels", "How do I book a room?", "What time is check-in?", "View my bookings"].map((prompt) => <button key={prompt} type="button" onClick={() => sendText(prompt)} disabled={sending}>
                                <span>{prompt}</span><FiArrowUpRight />
                            </button>)}
                        </div>
                    </div> : messages.map((item) => <div className={`chatbot-message chatbot-message-${item.from}`} key={item.id}>
                        <p>{item.text}</p>
                        {item.cards?.length > 0 && <div className="chatbot-room-results">
                            {item.cards.map((room) => <article className="chatbot-room-card" key={room.id}>
                                <div className="chatbot-room-card-heading">
                                    <strong>{room.title}</strong>
                                    {room.nightlyRate !== null && <span>₹{Number(room.nightlyRate).toLocaleString("en-IN")}<small>/night</small></span>}
                                </div>
                                <p>{room.hotelName}{room.city ? ` · ${room.city}` : ""}</p>
                                <div className="chatbot-room-card-footer">
                                    <small>Fits up to {room.capacity} guests</small>
                                    {user.role !== "admin" && <button type="button" onClick={() => chooseRoomForBooking(room)} disabled={bookingBusy}>
                                        {bookingBusy ? "Loading…" : "Choose room"}
                                    </button>}
                                </div>
                            </article>)}
                        </div>}
                        {item.hotelCards?.length > 0 && <div className="chatbot-hotel-results">
                            {item.hotelCards.map((hotel) => <article className="chatbot-hotel-card" key={hotel.id}>
                                {hotel.image && <img src={resolveImageUrl(hotel.image)} alt={hotel.name} loading="lazy" />}
                                <div className="chatbot-hotel-card-body">
                                    <div className="chatbot-hotel-card-title"><strong>{hotel.name}</strong>{hotel.rating && <span><FiStar aria-hidden="true" /> {hotel.rating}/5</span>}</div>
                                    <p className="chatbot-hotel-location"><FiMapPin aria-hidden="true" /> {[hotel.city, hotel.address].filter(Boolean).join(" · ")}</p>
                                    <div className="chatbot-hotel-meta">{hotel.category && <span>{hotel.category}</span>}{hotel.listedPrice && <span>From ₹{Number(hotel.listedPrice).toLocaleString("en-IN")}</span>}</div>
                                    {hotel.amenities?.length > 0 && <p className="chatbot-hotel-amenities">{hotel.amenities.join(" · ")}</p>}
                                    <div className="chatbot-hotel-actions"><button type="button" className="chatbot-hotel-secondary" onClick={() => viewHotelDetails(hotel)}>View details</button>{user.role !== "admin" && <button type="button" onClick={() => selectHotelForBooking(hotel)} disabled={bookingBusy}>{bookingBusy ? "Loading..." : "Select hotel"}</button>}</div>
                                </div>
                            </article>)}
                        </div>}
                        {item.source && <small>From: {item.source}</small>}
                    </div>)}
                    {sending && <div className="chatbot-typing">Finding an answer…</div>}
                    {user.role !== "admin" && bookingFlow && <div className="chatbot-booking-handoff">
                        {!bookingProposal ? <form className="chatbot-booking-form" onSubmit={prepareBooking}>
                            <div className="chatbot-booking-intro"><strong>Let's plan your stay</strong><span>Your choice is checked against live availability before a booking is created.</span></div>
                            <label>Hotel<select name="hotel_id" value={bookingDetails.hotel_id} onChange={updateBookingField}><option value="">Choose a hotel</option>{hotels.map((hotel) => <option key={hotel._id} value={hotel._id}>{hotel.name} · {hotel.city}</option>)}</select></label>
                            <label>Room<select name="room_id" value={bookingDetails.room_id} onChange={updateBookingField} disabled={!bookingHotel}><option value="">Choose a room</option>{(bookingHotel?.rooms || []).map((room) => <option key={room._id} value={room._id}>{room.name} · ₹{Number(room.base_price).toLocaleString("en-IN")}/night · up to {room.capacity} guests</option>)}</select></label>
                            <div className="chatbot-booking-date-row"><label>Check in<input type="date" name="check_in_date" value={bookingDetails.check_in_date} onChange={updateBookingField} min={new Date().toISOString().slice(0, 10)} /></label><label>Check out<input type="date" name="check_out_date" value={bookingDetails.check_out_date} onChange={updateBookingField} min={bookingDetails.check_in_date || new Date().toISOString().slice(0, 10)} /></label></div>
                            <label>Guests<input type="number" name="number_of_guests" min="1" max={bookingHotel?.rooms?.find((room) => String(room._id) === bookingDetails.room_id)?.capacity || 20} value={bookingDetails.number_of_guests} onChange={updateBookingField} /></label>
                            {bookingError && <p className="chatbot-booking-error" role="alert">{bookingError}</p>}
                            <div className="chatbot-booking-actions"><button type="button" className="chatbot-booking-secondary" onClick={() => setBookingFlow(false)}>Cancel</button><button type="submit" disabled={bookingBusy}>{bookingBusy ? "Checking…" : "Review booking"}</button></div>
                        </form> : <div className="chatbot-approval-card">
                            <strong>Review booking before payment</strong>
                            {bookingHotel?.images?.[0] && <img className="chatbot-summary-image" src={resolveImageUrl(bookingHotel.images[0])} alt={bookingProposal.hotelName} />}
                            <p>{bookingProposal.hotelName} · {bookingProposal.roomName}</p>
                            <p>{bookingProposal.check_in_date} to {bookingProposal.check_out_date} · {bookingProposal.nights} night(s) · {bookingProposal.number_of_guests} guest(s)</p>
                            <div className="chatbot-price-breakdown"><p>{bookingProposal.nights} night(s) × ₹{bookingProposal.nightlyRate.toLocaleString("en-IN")} <span>₹{bookingProposal.subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></p><p>Tax (18%) <span>₹{bookingProposal.taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></p><p className="chatbot-price-total">Total <b>₹{bookingProposal.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></p></div>
                            <small>Availability and final price are checked again when you approve. Payment is handled by Razorpay.</small>
                            {bookingError && <p className="chatbot-booking-error" role="alert">{bookingError}</p>}
                            <div className="chatbot-booking-actions"><button type="button" className="chatbot-booking-secondary" disabled={bookingBusy} onClick={() => setBookingProposal(null)}>Edit</button><button type="button" disabled={bookingBusy} onClick={approveBooking}>{bookingBusy ? "Starting checkout…" : "Approve and pay"}</button></div>
                        </div>}
                    </div>}
                </div>
                {error && <div className="chatbot-error" role="alert"><span>{error}</span>{retryQuestion && <button type="button" onClick={() => sendText(retryQuestion, true)} disabled={sending}>Retry</button>}</div>}
                <form className="chatbot-form" onSubmit={sendMessage}>
                    <input
                        aria-label="Your message"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Ask a question…"
                        maxLength={4000}
                        disabled={sending}
                    />
                    <button type="submit" aria-label="Send message" disabled={sending || !message.trim()}>
                        <FiSend />
                    </button>
                </form>
            </section>}
            {!isFullscreen && <button
                className={`chatbot-launcher ${isOpen ? "chatbot-launcher-open" : ""}`}
                type="button"
                aria-label={isOpen ? "Close hotel help chat" : "Open hotel help chat"}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
            >
                {isOpen ? <FiX /> : <><FiMessageCircle /><span>Help</span></>}
            </button>}
        </div>
    );
}

export default ChatbotWidget;
