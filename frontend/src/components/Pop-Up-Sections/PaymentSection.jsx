import { useContext } from "react";
import { FiShield } from "react-icons/fi";
import { HotelDetailsDataProvider } from "../../context/HotelDetailsContext";

function PaymentSection() {
    const { userBookingData, currBookingDetails } = useContext(HotelDetailsDataProvider);
    const room = currBookingDetails?.hotel?.rooms?.[currBookingDetails?.roomIndex];
    const checkIn = new Date(`${userBookingData.check_in_date}T00:00:00`);
    const checkOut = new Date(`${userBookingData.check_out_date}T00:00:00`);
    const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (24 * 60 * 60 * 1000)) || 1);
    const total = Number(room?.base_price || 0) * nights;
    const tax = total * 0.18;

    return (
        <div className="booking-confirmation-step">
            <span className="booking-demo-icon"><FiShield /></span>
            <h2>Review and pay</h2>
            <p>Your booking is confirmed after secure payment through Razorpay.</p>
            <div className="booking-review-lines">
                <div><span>Room</span><strong>{room?.name}</strong></div>
                <div><span>Stay length</span><strong>{nights} night{nights === 1 ? "" : "s"}</strong></div>
                <div><span>Room total</span><strong>₹{total.toLocaleString("en-IN")}</strong></div>
                <div><span>Tax (18%)</span><strong>₹{tax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
                <div className="booking-review-total"><span>Total to pay</span><strong>₹{(total + tax).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
            </div>
            <p className="booking-demo-note">Your payment details are handled by Razorpay and are never stored by this site.</p>
        </div>
    );
}

export default PaymentSection;
